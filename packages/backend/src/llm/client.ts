import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config';
import { logger } from '../utils/logger';

export interface Message {
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string;
  name?: string;
}

export interface Tool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: any;
  };
}

export interface LLMResponse {
  content: string;
  toolCalls?: Array<{
    id: string;
    name: string;
    arguments: any;
  }>;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
}

class LLMClient {
  private openai: OpenAI;
  private anthropic: Anthropic;

  constructor() {
    this.openai = new OpenAI({
      apiKey: config.llm.openai.apiKey,
    });

    this.anthropic = new Anthropic({
      apiKey: config.llm.anthropic.apiKey,
    });
  }

  async chat(
    messages: Message[],
    options: {
      model?: string;
      tools?: Tool[];
      temperature?: number;
      maxTokens?: number;
    } = {}
  ): Promise<LLMResponse> {
    const {
      model = config.execution.defaultModel,
      tools = [],
      temperature = 0.7,
      maxTokens = 4096,
    } = options;

    logger.debug('LLM chat request', { model, messagesCount: messages.length, toolsCount: tools.length });

    try {
      if (model.startsWith('gpt-') || model.startsWith('o1-')) {
        return await this.chatOpenAI(messages, { model, tools, temperature, maxTokens });
      } else if (model.startsWith('claude-')) {
        return await this.chatAnthropic(messages, { model, tools, temperature, maxTokens });
      } else {
        throw new Error(`Unsupported model: ${model}`);
      }
    } catch (error) {
      logger.error('LLM chat error:', error);
      throw error;
    }
  }

  private async chatOpenAI(
    messages: Message[],
    options: { model: string; tools: Tool[]; temperature: number; maxTokens: number }
  ): Promise<LLMResponse> {
    const response = await this.openai.chat.completions.create({
      model: options.model,
      messages: messages as any,
      tools: options.tools.length > 0 ? options.tools as any : undefined,
      temperature: options.temperature,
      max_tokens: options.maxTokens,
    });

    const choice = response.choices[0];
    const toolCalls = choice.message.tool_calls?.map((tc) => ({
      id: tc.id,
      name: tc.function.name,
      arguments: JSON.parse(tc.function.arguments),
    }));

    return {
      content: choice.message.content || '',
      toolCalls,
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      },
      model: response.model,
    };
  }

  private async chatAnthropic(
    messages: Message[],
    options: { model: string; tools: Tool[]; temperature: number; maxTokens: number }
  ): Promise<LLMResponse> {
    const systemMessage = messages.find((m) => m.role === 'system')?.content || '';
    const userMessages = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })) as Anthropic.MessageParam[];

    const tools = options.tools.map((t) => ({
      name: t.function.name,
      description: t.function.description,
      input_schema: t.function.parameters,
    }));

    const response = await this.anthropic.messages.create({
      model: options.model,
      system: systemMessage,
      messages: userMessages,
      tools: tools.length > 0 ? tools : undefined,
      temperature: options.temperature,
      max_tokens: options.maxTokens,
    });

    const textContent = response.content.find((c) => c.type === 'text');
    const toolUseContent = response.content.filter((c) => c.type === 'tool_use');

    const toolCalls = toolUseContent.map((tc: any) => ({
      id: tc.id,
      name: tc.name,
      arguments: tc.input,
    }));

    return {
      content: textContent && textContent.type === 'text' ? textContent.text : '',
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      },
      model: response.model,
    };
  }
}

export const llmClient = new LLMClient();
