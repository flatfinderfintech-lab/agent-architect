import { Router } from 'express';
import { db } from '../database/client';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// GET /api/marketplace - Browse marketplace listings
router.get('/', async (req, res) => {
  try {
    const { category, search, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT ml.*,
        a.name as agent_name,
        a.description as agent_description,
        u.username as creator_username
      FROM marketplace_listings ml
      JOIN agents a ON ml.agent_id = a.id
      JOIN users u ON ml.creator_id = u.id
      WHERE ml.is_active = true
    `;

    const params: any[] = [];

    if (category) {
      params.push(category);
      query += ` AND ml.category = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (ml.title ILIKE $${params.length} OR ml.description ILIKE $${params.length})`;
    }

    query += ` ORDER BY ml.total_subscriptions DESC, ml.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    res.json({ listings: result.rows });
  } catch (error: any) {
    logger.error('Error fetching marketplace listings:', error);
    res.status(500).json({ error: 'Failed to fetch marketplace listings' });
  }
});

// GET /api/marketplace/:id - Get marketplace listing details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT ml.*,
        a.name as agent_name,
        a.description as agent_description,
        a.system_prompt,
        u.username as creator_username,
        json_agg(json_build_object(
          'id', t.id,
          'name', t.name,
          'description', t.description
        )) FILTER (WHERE t.id IS NOT NULL) as tools
       FROM marketplace_listings ml
       JOIN agents a ON ml.agent_id = a.id
       JOIN users u ON ml.creator_id = u.id
       LEFT JOIN agent_tools at ON a.id = at.agent_id
       LEFT JOIN tools t ON at.tool_id = t.id
       WHERE ml.id = $1
       GROUP BY ml.id, a.id, u.username`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    res.json({ listing: result.rows[0] });
  } catch (error: any) {
    logger.error('Error fetching marketplace listing:', error);
    res.status(500).json({ error: 'Failed to fetch marketplace listing' });
  }
});

// POST /api/marketplace - Create a new marketplace listing
router.post('/', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      agentId,
      title,
      description,
      category,
      priceMonthly,
      revenueShare = 70.00,
    } = req.body;

    if (!agentId || !title || !priceMonthly) {
      return res.status(400).json({ error: 'Agent ID, title, and price are required' });
    }

    // Verify agent ownership
    const agentResult = await db.query(
      'SELECT id FROM agents WHERE id = $1 AND user_id = $2',
      [agentId, userId]
    );

    if (agentResult.rows.length === 0) {
      return res.status(403).json({ error: 'Agent not found or unauthorized' });
    }

    const listingId = uuidv4();

    await db.transaction(async (client) => {
      // Create listing
      await client.query(
        `INSERT INTO marketplace_listings (id, agent_id, creator_id, title, description, category, price_monthly, revenue_share)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [listingId, agentId, userId, title, description, category, priceMonthly, revenueShare]
      );

      // Mark agent as published
      await client.query(
        'UPDATE agents SET is_published = true, is_public = true WHERE id = $1',
        [agentId]
      );
    });

    const result = await db.query('SELECT * FROM marketplace_listings WHERE id = $1', [listingId]);

    logger.info('Marketplace listing created', { listingId, userId });
    res.status(201).json({ listing: result.rows[0] });
  } catch (error: any) {
    logger.error('Error creating marketplace listing:', error);
    res.status(500).json({ error: 'Failed to create marketplace listing' });
  }
});

// POST /api/marketplace/:id/subscribe - Subscribe to a marketplace listing
router.post('/:id/subscribe', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    // Check if listing exists and is active
    const listingResult = await db.query(
      'SELECT * FROM marketplace_listings WHERE id = $1 AND is_active = true',
      [id]
    );

    if (listingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Listing not found or inactive' });
    }

    const listing = listingResult.rows[0];
    const subscriptionId = uuidv4();

    await db.transaction(async (client) => {
      // Create subscription
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);

      await client.query(
        `INSERT INTO subscriptions (id, user_id, listing_id, status, expires_at)
         VALUES ($1, $2, $3, 'active', $4)
         ON CONFLICT (user_id, listing_id) DO UPDATE
         SET status = 'active', expires_at = $4`,
        [subscriptionId, userId, id, expiresAt]
      );

      // Update listing stats
      await client.query(
        `UPDATE marketplace_listings
         SET total_subscriptions = total_subscriptions + 1
         WHERE id = $1`,
        [id]
      );
    });

    logger.info('User subscribed to listing', { listingId: id, userId });
    res.json({ message: 'Successfully subscribed' });
  } catch (error: any) {
    logger.error('Error subscribing to listing:', error);
    res.status(500).json({ error: 'Failed to subscribe' });
  }
});

// GET /api/marketplace/my/listings - Get creator's listings
router.get('/my/listings', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await db.query(
      `SELECT ml.*, a.name as agent_name
       FROM marketplace_listings ml
       JOIN agents a ON ml.agent_id = a.id
       WHERE ml.creator_id = $1
       ORDER BY ml.created_at DESC`,
      [userId]
    );

    res.json({ listings: result.rows });
  } catch (error: any) {
    logger.error('Error fetching creator listings:', error);
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
});

// GET /api/marketplace/my/subscriptions - Get user's subscriptions
router.get('/my/subscriptions', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await db.query(
      `SELECT s.*, ml.title, ml.price_monthly, a.name as agent_name
       FROM subscriptions s
       JOIN marketplace_listings ml ON s.listing_id = ml.id
       JOIN agents a ON ml.agent_id = a.id
       WHERE s.user_id = $1
       ORDER BY s.started_at DESC`,
      [userId]
    );

    res.json({ subscriptions: result.rows });
  } catch (error: any) {
    logger.error('Error fetching subscriptions:', error);
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

export default router;
