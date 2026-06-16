import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db/db.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';

// Extend Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
        authId: string;
      };
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);

    if (!token || token === 'undefined' || token === 'null') {
      return res.status(401).json({ error: 'Empty token' });
    }

    // Verify JWT token using Auth.js secret
    const decoded = jwt.verify(token, process.env.AUTH_SECRET || 'dev-secret') as any;

    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token payload' });
    }

    const lookupAuthId = decoded.sub || decoded.authId;

    if (!lookupAuthId) {
      console.error('[Auth] JWT decoded but no sub/authId found:', decoded);
      return res.status(401).json({ error: 'Invalid token: missing identity' });
    }

    // Fetch user from database to get latest role and data
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.authId, lookupAuthId));

    if (!user) {
      console.error('[Auth] No user found for authId:', lookupAuthId);
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = {
      id: user.id,
      role: user.role,
      authId: user.authId
    };

    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    console.error('[Auth] Unexpected error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        required: allowedRoles,
        current: req.user.role,
      });
    }

    next();
  };
};
