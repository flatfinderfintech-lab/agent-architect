import { Router } from 'express';
import { db } from '../database/client';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// GET /api/agents - List all agents for the authenticated user
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await db.query(
      `SELECT a.*,
        COUNT(DISTINCT at.tool_id) as tool_count,
        COUNT(DISTINCT e.id) as execution_count
       FROM agents a
       LEFT JOIN agent_tools at ON a.id = at.agent_id
       LEFT JOIN executions e ON a.id = e.agent_id
       WHERE a.user_id = $1
       GROUP BY a.id
       ORDER BY a.created_at DESC`,
      [userId]
    );

    res.json({ agents: result.rows });
  } catch (error: any) {
    logger.error('Error fetching agents:', error);
    res.status(500).json({ error: 'Failed to fetch agents' });
  }
});

// GET /api/agents/:id - Get a specific agent
router.get('/:id', async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    const result = await db.query(
      `SELECT a.*,
        json_agg(json_build_object(
          'id', t.id,
          'name', t.name,
          'description', t.description,
          'schema', t.schema,
          'configuration', at.configuration
        )) FILTER (WHERE t.id IS NOT NULL) as tools
       FROM agents a
       LEFT JOIN agent_tools at ON a.id = at.agent_id
       LEFT JOIN tools t ON at.tool_id = t.id
       WHERE a.id = $1 AND (a.user_id = $2 OR a.is_public = true)
       GROUP BY a.id`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    res.json({ agent: result.rows[0] });
  } catch (error: any) {
    logger.error('Error fetching agent:', error);
    res.status(500).json({ error: 'Failed to fetch agent' });
  }
});

// POST /api/agents - Create a new agent
router.post('/', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      name,
      description,
      systemPrompt,
      autonomyLevel = 'supervised',
      model = 'gpt-4-turbo-preview',
      maxIterations = 10,
      timeoutSeconds = 300,
      tools = [],
    } = req.body;

    if (!name || !systemPrompt) {
      return res.status(400).json({ error: 'Name and system prompt are required' });
    }

    const agentId = uuidv4();

    await db.transaction(async (client) => {
      // Create agent
      await client.query(
        `INSERT INTO agents (id, user_id, name, description, system_prompt, autonomy_level, model, max_iterations, timeout_seconds)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [agentId, userId, name, description, systemPrompt, autonomyLevel, model, maxIterations, timeoutSeconds]
      );

      // Attach tools
      for (const toolId of tools) {
        await client.query(
          `INSERT INTO agent_tools (agent_id, tool_id) VALUES ($1, $2)`,
          [agentId, toolId]
        );
      }
    });

    const result = await db.query('SELECT * FROM agents WHERE id = $1', [agentId]);

    logger.info('Agent created', { agentId, userId });
    res.status(201).json({ agent: result.rows[0] });
  } catch (error: any) {
    logger.error('Error creating agent:', error);
    res.status(500).json({ error: 'Failed to create agent' });
  }
});

// PUT /api/agents/:id - Update an agent
router.put('/:id', async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const {
      name,
      description,
      systemPrompt,
      autonomyLevel,
      model,
      maxIterations,
      timeoutSeconds,
      tools,
    } = req.body;

    await db.transaction(async (client) => {
      // Update agent
      await client.query(
        `UPDATE agents
         SET name = COALESCE($1, name),
             description = COALESCE($2, description),
             system_prompt = COALESCE($3, system_prompt),
             autonomy_level = COALESCE($4, autonomy_level),
             model = COALESCE($5, model),
             max_iterations = COALESCE($6, max_iterations),
             timeout_seconds = COALESCE($7, timeout_seconds),
             updated_at = NOW()
         WHERE id = $8 AND user_id = $9`,
        [name, description, systemPrompt, autonomyLevel, model, maxIterations, timeoutSeconds, id, userId]
      );

      // Update tools if provided
      if (tools && Array.isArray(tools)) {
        await client.query('DELETE FROM agent_tools WHERE agent_id = $1', [id]);
        for (const toolId of tools) {
          await client.query(
            `INSERT INTO agent_tools (agent_id, tool_id) VALUES ($1, $2)`,
            [id, toolId]
          );
        }
      }
    });

    const result = await db.query('SELECT * FROM agents WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    logger.info('Agent updated', { agentId: id, userId });
    res.json({ agent: result.rows[0] });
  } catch (error: any) {
    logger.error('Error updating agent:', error);
    res.status(500).json({ error: 'Failed to update agent' });
  }
});

// DELETE /api/agents/:id - Delete an agent
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    const result = await db.query(
      'DELETE FROM agents WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    logger.info('Agent deleted', { agentId: id, userId });
    res.json({ message: 'Agent deleted successfully' });
  } catch (error: any) {
    logger.error('Error deleting agent:', error);
    res.status(500).json({ error: 'Failed to delete agent' });
  }
});

// POST /api/agents/:id/clone - Clone an agent
router.post('/:id/clone', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { name } = req.body;

    const newAgentId = uuidv4();

    await db.transaction(async (client) => {
      // Clone agent
      await client.query(
        `INSERT INTO agents (id, user_id, name, description, system_prompt, autonomy_level, model, max_iterations, timeout_seconds, parent_agent_id)
         SELECT $1, $2, $3, description, system_prompt, autonomy_level, model, max_iterations, timeout_seconds, $4
         FROM agents WHERE id = $4 AND (user_id = $2 OR is_public = true)`,
        [newAgentId, userId, name || `Clone of ${id}`, id]
      );

      // Clone tools
      await client.query(
        `INSERT INTO agent_tools (agent_id, tool_id, configuration)
         SELECT $1, tool_id, configuration
         FROM agent_tools WHERE agent_id = $2`,
        [newAgentId, id]
      );
    });

    const result = await db.query('SELECT * FROM agents WHERE id = $1', [newAgentId]);

    logger.info('Agent cloned', { originalId: id, newId: newAgentId, userId });
    res.status(201).json({ agent: result.rows[0] });
  } catch (error: any) {
    logger.error('Error cloning agent:', error);
    res.status(500).json({ error: 'Failed to clone agent' });
  }
});

export default router;
