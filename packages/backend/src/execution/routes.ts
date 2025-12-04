import { Router } from 'express';
import { db } from '../database/client';
import { logger } from '../utils/logger';
import { reactEngine } from './react-engine';

const router = Router();

// POST /api/executions - Execute an agent
router.post('/', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { agentId, input } = req.body;

    if (!agentId || !input) {
      return res.status(400).json({ error: 'Agent ID and input are required' });
    }

    // Fetch agent with tools
    const agentResult = await db.query(
      `SELECT a.*,
        json_agg(json_build_object(
          'id', t.id,
          'name', t.name,
          'schema', t.schema
        )) FILTER (WHERE t.id IS NOT NULL) as tools
       FROM agents a
       LEFT JOIN agent_tools at ON a.id = at.agent_id
       LEFT JOIN tools t ON at.tool_id = t.id
       WHERE a.id = $1 AND (a.user_id = $2 OR a.is_public = true)
       GROUP BY a.id`,
      [agentId, userId]
    );

    if (agentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    const agent = agentResult.rows[0];

    // Execute agent
    const result = await reactEngine.execute(
      {
        id: agent.id,
        systemPrompt: agent.system_prompt,
        model: agent.model,
        maxIterations: agent.max_iterations,
        timeoutSeconds: agent.timeout_seconds,
        tools: agent.tools || [],
      },
      input,
      userId
    );

    logger.info('Execution completed', { executionId: result.executionId, agentId, userId });
    res.json({ execution: result });
  } catch (error: any) {
    logger.error('Error executing agent:', error);
    res.status(500).json({ error: 'Failed to execute agent' });
  }
});

// GET /api/executions/:id - Get execution details
router.get('/:id', async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    const result = await db.query(
      `SELECT e.*,
        a.name as agent_name,
        json_agg(json_build_object(
          'step_number', el.step_number,
          'step_type', el.step_type,
          'reasoning', el.reasoning,
          'action', el.action,
          'observation', el.observation,
          'created_at', el.created_at
        ) ORDER BY el.step_number) FILTER (WHERE el.id IS NOT NULL) as steps
       FROM executions e
       JOIN agents a ON e.agent_id = a.id
       LEFT JOIN execution_logs el ON e.id = el.execution_id
       WHERE e.id = $1 AND e.user_id = $2
       GROUP BY e.id, a.name`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Execution not found' });
    }

    res.json({ execution: result.rows[0] });
  } catch (error: any) {
    logger.error('Error fetching execution:', error);
    res.status(500).json({ error: 'Failed to fetch execution' });
  }
});

// GET /api/executions - List executions
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { agentId, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT e.*, a.name as agent_name
      FROM executions e
      JOIN agents a ON e.agent_id = a.id
      WHERE e.user_id = $1
    `;

    const params: any[] = [userId];

    if (agentId) {
      params.push(agentId);
      query += ` AND e.agent_id = $${params.length}`;
    }

    query += ` ORDER BY e.started_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    res.json({ executions: result.rows });
  } catch (error: any) {
    logger.error('Error fetching executions:', error);
    res.status(500).json({ error: 'Failed to fetch executions' });
  }
});

export default router;
