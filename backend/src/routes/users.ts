import { Router } from 'express';
import pool from '../db';
import { authMiddleware } from '../middleware/auth';
import { AuthenticatedRequest } from '../types/express';

const router = Router();

// GET /users - List all users
router.get('/', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await pool.query('SELECT id, email, name, role, created_at, updated_at FROM users ORDER BY name ASC');
    const users = result.rows;
    res.json({ users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
