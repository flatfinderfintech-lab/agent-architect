import { Request, Response, NextFunction } from 'express';
import { ClerkExpressWithAuth } from '@clerk/express';
import { db } from '../database/client';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        clerkId: string;
        email: string;
        username?: string;
      };
    }
  }
}

export const clerkMiddleware = ClerkExpressWithAuth();

export const authenticateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const auth = (req as any).auth;

    if (!auth?.userId) {
      return next();
    }

    // Check if user exists in our database
    let userResult = await db.query(
      'SELECT * FROM users WHERE clerk_id = $1',
      [auth.userId]
    );

    let user;

    if (userResult.rows.length === 0) {
      // Create user if doesn't exist
      const email = auth.sessionClaims?.email as string || `user_${auth.userId}@example.com`;
      const username = auth.sessionClaims?.username as string;

      const userId = uuidv4();

      await db.query(
        `INSERT INTO users (id, clerk_id, email, username)
         VALUES ($1, $2, $3, $4)`,
        [userId, auth.userId, email, username]
      );

      userResult = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
      logger.info('New user created', { userId, clerkId: auth.userId });
    }

    user = userResult.rows[0];

    req.user = {
      id: user.id,
      clerkId: user.clerk_id,
      email: user.email,
      username: user.username,
    };

    next();
  } catch (error: any) {
    logger.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};
