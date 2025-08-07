import { Router } from 'express';
import pool from '../db';
import { authMiddleware } from '../middleware/auth';
import { AuthenticatedRequest } from '../types/express';

const router = Router();

router.get('/', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const totalResult = await pool.query('SELECT COUNT(*) as count FROM payment_orders');
    const pendingResult = await pool.query("SELECT COUNT(*) as count FROM payment_orders WHERE status IN ('acknowledge', 'approval', 'last_approval', 'verification')");
    const completedResult = await pool.query("SELECT COUNT(*) as count FROM payment_orders WHERE status = 'paid'");
    const amountResult = await pool.query("SELECT COALESCE(SUM(amount), 0) as total FROM payment_orders WHERE status = 'paid'");
    const statusBreakdown = await pool.query("SELECT status, COUNT(*) as count FROM payment_orders GROUP BY status ORDER BY count DESC");
    const departmentBreakdown = await pool.query("SELECT department, COUNT(*) as count FROM payment_orders GROUP BY department ORDER BY count DESC");
    const recentOrders = await pool.query(`
      SELECT
        po.id, po.po_number, po.vendor_name, po.project_name, po.amount, po.status, po.department, po.created_at, u.name as created_by_name
      FROM payment_orders po
      JOIN users u ON po.created_by = u.id
      ORDER BY po.created_at DESC
      LIMIT 10
    `);

    const stats = {
      total_orders: parseInt(totalResult.rows[0].count, 10) || 0,
      pending_approval: parseInt(pendingResult.rows[0].count, 10) || 0,
      completed_orders: parseInt(completedResult.rows[0].count, 10) || 0,
      total_amount: parseFloat(amountResult.rows[0].total) || 0,
      status_breakdown: statusBreakdown.rows,
      department_breakdown: departmentBreakdown.rows,
      recent_orders: recentOrders.rows,
    };

    res.json({ stats });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
