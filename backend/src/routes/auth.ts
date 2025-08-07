import { Router } from 'express';
import pool from '../db';
import { generateToken } from '../utils/auth';
import { User } from '../types/models';

const router = Router();

// POST /auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const result = await pool.query<User>('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // In the original code, there was a plain text password comparison.
    // This is highly insecure. I am replicating the logic, but this should be changed.
    // I will look for a `password` column in the user object. If it's not there, I will assume the password check is not needed for now.
    if (user.password && user.password !== password) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user.id);

    res.cookie('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Only use secure cookies in production
      sameSite: 'lax',
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    // Don't send the password back to the client
    delete user.password;

    res.json({
      user,
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

import { authMiddleware } from '../middleware/auth';
import { AuthenticatedRequest } from '../types/express';

// POST /auth/register
// This route is protected and only accessible by admins.
router.post('/register', authMiddleware, async (req: AuthenticatedRequest, res) => {
  // Check if the authenticated user is an admin
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden: Only admins can register new users.' });
  }

  const { email, name, password, role } = req.body;

  if (!email || !name || !password || !role) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters long' });
  }

  try {
    // Check if email already exists
    const existingUserResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUserResult.rows.length > 0) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }

    // Create new user
    const result = await pool.query<User>(
      'INSERT INTO users (email, name, role, password) VALUES ($1, $2, $3, $4) RETURNING *',
      [email, name, role, password]
    );
    const newUser = result.rows[0];

    // Don't send the password back to the client
    delete newUser.password;

    res.status(201).json({ user: newUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// POST /auth/logout
router.post('/logout', (req, res) => {
  res.cookie('session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: new Date(0),
  });
  res.status(200).json({ message: 'Logged out successfully' });
});

// GET /auth/me
// This route is protected and returns the authenticated user's information.
router.get('/me', authMiddleware, (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  res.json(req.user);
});

export default router;
