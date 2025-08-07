import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/express';
import pool from '../db';
import { User } from '../types/models';

export const authMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies.session;

  if (!token) {
    return res.status(401).json({ message: 'Authentication token missing' });
  }

  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    const userId = parseInt(parts[0], 10);
    if (isNaN(userId)) {
      throw new Error('Invalid user ID in token');
    }

    const result = await pool.query<User>('SELECT * FROM users WHERE id = $1', [userId]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // a property password that should not be exposed to the client.
    delete user.password;

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export const adminMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden: Admins only' });
  }
  next();
};
