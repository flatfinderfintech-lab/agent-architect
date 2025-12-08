import { llmClient, Message, Tool } from '../llm/client';
import { logger } from '../utils/logger';
import { toolExecutor } from '../tools/executor';
import { db } from '../database/client';
import { v4 as uuidv4 } from 'uuid';

export interface ExecutionStep {
  stepNumber: number;
  stepType: 'reasoning' | 'action' | 'observation' | 'final';
  reasoning?: string;
  action?: {
    tool: string;
    arguments: any;
  };
  observation?: string;
  timestamp: Date;
}

export interface ExecutionResult {
  executionId: string;
  status: 'success' | 'error' | 'timeout' | 'max_iterations';
  output: string;
  steps: ExecutionStep[];
  tokensUsed: number;
  cost: number;
  executionTimeMs: number;
  error?: string;
}

export interface AgentConfig {
  id: string;
  systemPrompt: string;
  model: string;
  maxIterations: number;
  timeoutSeconds: number;
  tools: Array<{
    id: string;
    name: string;
    schema: any;
  }>;
}

export class ReActEngine {
  private static readonly TOKEN_COSTS = {
    'gpt-4-turbo-preview': { input: 0.01 / 1000, output: 0.03 / 1000 },
    'gpt-4': { input: 0.03 / 1000, output: 0.06 / 1000 },
    'gpt-3.5-turbo': { input: 0.0005 / 1000, output: 0.0015 / 1000 },
    'claude-3-opus-20240229': { input: 0.015 / 1000, output: 0.075 / 1000 },
    'claude-3-sonnet-20240229': { input: 0.003 / 1000, output: 0.015 / 1000 },
    'claude-3-haiku-20240307': { input: 0.00025 / 1000, output: 0.00125 / 1000 },
  };

  async execute(
    agentConfig: AgentConfig,
    input: string,
    userId: string
  ): Promise<ExecutionResult> {
    const executionId = uuidv4();
    const startTime = Date.now();
    const steps: ExecutionStep[] = [];
    let totalTokensUsed = 0;
    let totalCost = 0;

    logger.info('Starting agent execution', { executionId, agentId: agentConfig.id, userId });

    try {
      // Create execution record
      await db.query(
        `INSERT INTO executions (id, agent_id, user_id, input, status)
         VALUES ($1, $2, $3, $4, 'running')`,
        [executionId, agentConfig.id, userId, input]
      );

      const messages: Message[] = [
        {
          role: 'system',
          content: this.buildSystemPrompt(agentConfig.systemPrompt, agentConfig.tools),
        },
        {
          role: 'user',
          content: input,
        },
      ];

      const tools: Tool[] = agentConfig.tools.map((t) => JSON.parse(t.schema));

      let iteration = 0;
      let finalAnswer = '';
      let status: ExecutionResult['status'] = 'success';

      while (iteration < agentConfig.maxIterations) {
        iteration++;

        // Check timeout
        const elapsed = Date.now() - startTime;
        if (elapsed > agentConfig.timeoutSeconds * 1000) {
          status = 'timeout';
          finalAnswer = 'Execution timed out';
          break;
        }

        logger.debug(`Iteration ${iteration}`, { executionId });

        // Get LLM response
        const response = await llmClient.chat(messages, {
          model: agentConfig.model,
          tools,
        });

        totalTokensUsed += response.usage.totalTokens;
        totalCost += this.calculateCost(
          agentConfig.model,
          response.usage.promptTokens,
          response.usage.completionTokens
        );

        // If no tool calls, this is the final answer
        if (!response.toolCalls || response.toolCalls.length === 0) {
          finalAnswer = response.content;
          steps.push({
            stepNumber: iteration,
            stepType: 'final',
            reasoning: response.content,
            timestamp: new Date(),
          });

          // Log step to database
          await this.logStep(executionId, iteration, 'final', response.content);
          break;
        }

        // Process tool calls (ReAct: Reasoning → Action → Observation)
        for (const toolCall of response.toolCalls) {
          // Reasoning step
          steps.push({
            stepNumber: iteration,
            stepType: 'reasoning',
            reasoning: response.content,
            timestamp: new Date(),
          });

          await this.logStep(executionId, iteration, 'reasoning', response.content);

          // Action step
          steps.push({
            stepNumber: iteration,
            stepType: 'action',
            action: {
              tool: toolCall.name,
              arguments: toolCall.arguments,
            },
            timestamp: new Date(),
          });

          await this.logStep(
            executionId,
            iteration,
            'action',
            null,
            { tool: toolCall.name, arguments: toolCall.arguments }
          );

          // Execute tool
          let observation: string;
          try {
            const result = await toolExecutor.execute(
              toolCall.name,
              toolCall.arguments
            );
            observation = JSON.stringify(result);
          } catch (error: any) {
            observation = `Error: ${error.message}`;
            logger.error('Tool execution error:', error);
          }

          // Observation step
          steps.push({
            stepNumber: iteration,
            stepType: 'observation',
            observation,
            timestamp: new Date(),
          });

          await this.logStep(executionId, iteration, 'observation', observation);

          // Add tool result to messages
          messages.push({
            role: 'assistant',
            content: response.content,
          });

          messages.push({
            role: 'function',
            name: toolCall.name,
            content: observation,
          });
        }
      }

      // Check if max iterations reached
      if (iteration >= agentConfig.maxIterations && status === 'success') {
        status = 'max_iterations';
        finalAnswer = 'Maximum iterations reached without finding a final answer';
      }

      const executionTimeMs = Date.now() - startTime;

      // Update execution record
      await db.query(
        `UPDATE executions
         SET output = $1, status = $2, iterations = $3, tokens_used = $4,
             cost_usd = $5, execution_time_ms = $6, completed_at = NOW()
         WHERE id = $7`,
        [finalAnswer, status, iteration, totalTokensUsed, totalCost, executionTimeMs, executionId]
      );

      // Track usage
      await db.query(
        `INSERT INTO usage_tracking (user_id, execution_id, tokens_used, cost_usd)
         VALUES ($1, $2, $3, $4)`,
        [userId, executionId, totalTokensUsed, totalCost]
      );

      logger.info('Execution completed', {
        executionId,
        status,
        iterations: iteration,
        tokensUsed: totalTokensUsed,
        cost: totalCost,
      });

      return {
        executionId,
        status,
        output: finalAnswer,
        steps,
        tokensUsed: totalTokensUsed,
        cost: totalCost,
        executionTimeMs,
      };
    } catch (error: any) {
      logger.error('Execution error:', error);

      const executionTimeMs = Date.now() - startTime;

      await db.query(
        `UPDATE executions
         SET status = 'error', error_message = $1, execution_time_ms = $2, completed_at = NOW()
         WHERE id = $3`,
        [error.message, executionTimeMs, executionId]
      );

      return {
        executionId,
        status: 'error',
        output: '',
        steps,
        tokensUsed: totalTokensUsed,
        cost: totalCost,
        executionTimeMs,
        error: error.message,
      };
    }
  }

  private buildSystemPrompt(basePrompt: string, tools: AgentConfig['tools']): string {
    const toolDescriptions = tools
      .map((t) => `- ${t.name}: ${JSON.parse(t.schema).function.description}`)
      .join('\n');

    return `${basePrompt}

You are an AI agent using the ReAct (Reasoning + Acting) pattern. For each task:

1. **Reason**: Think step-by-step about what you need to do
2. **Act**: Use the appropriate tool if needed
3. **Observe**: Analyze the tool's output
4. **Repeat**: Continue until you have the final answer

Available tools:
${toolDescriptions}

When you have the final answer, respond directly without calling any tools.

Always think carefully and explain your reasoning.`;
  }

  private calculateCost(model: string, promptTokens: number, completionTokens: number): number {
    const costs = ReActEngine.TOKEN_COSTS[model as keyof typeof ReActEngine.TOKEN_COSTS] || {
      input: 0.01 / 1000,
      output: 0.03 / 1000,
    };

    return promptTokens * costs.input + completionTokens * costs.output;
  }

  private async logStep(
    executionId: string,
    stepNumber: number,
    stepType: string,
    reasoning?: string | null,
    action?: any
  ): Promise<void> {
    await db.query(
      `INSERT INTO execution_logs (execution_id, step_number, step_type, reasoning, action)
       VALUES ($1, $2, $3, $4, $5)`,
      [executionId, stepNumber, stepType, reasoning, action ? JSON.stringify(action) : null]
    );
  }
}

export const reactEngine = new ReActEngine();
