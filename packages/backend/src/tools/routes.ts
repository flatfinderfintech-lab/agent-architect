import { Router } from 'express';
import { db } from '../database/client';
import { logger } from '../utils/logger';

const router = Router();

// GET /api/tools - List all available tools
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;

    let query = 'SELECT * FROM tools WHERE 1=1';
    const params: any[] = [];

    if (category) {
      params.push(category);
      query += ` AND category = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (name ILIKE $${params.length} OR description ILIKE $${params.length})`;
    }

    query += ' ORDER BY is_official DESC, name ASC';

    const result = await db.query(query, params);

    res.json({ tools: result.rows });
  } catch (error: any) {
    logger.error('Error fetching tools:', error);
    res.status(500).json({ error: 'Failed to fetch tools' });
  }
});

// GET /api/tools/:id - Get a specific tool
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query('SELECT * FROM tools WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tool not found' });
    }

    res.json({ tool: result.rows[0] });
  } catch (error: any) {
    logger.error('Error fetching tool:', error);
    res.status(500).json({ error: 'Failed to fetch tool' });
  }
});

export default router;
