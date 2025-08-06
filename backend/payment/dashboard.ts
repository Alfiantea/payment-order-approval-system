import { api } from "encore.dev/api";
import { paymentDB } from "./db";

export interface DashboardStats {
  total_orders: number;
  pending_approval: number;
  completed_orders: number;
  total_amount: number;
  status_breakdown: { status: string; count: number }[];
  department_breakdown: { department: string; count: number }[];
  recent_orders: any[];
}

export interface DashboardResponse {
  stats: DashboardStats;
}

// Retrieves dashboard statistics and data.
export const dashboard = api<void, DashboardResponse>(
  { expose: true, method: "GET", path: "/dashboard" },
  async () => {
    // Get total orders
    const totalResult = await paymentDB.queryRow<{ count: number }>`
      SELECT COUNT(*) as count FROM payment_orders
    `;

    // Get pending approval count
    const pendingResult = await paymentDB.queryRow<{ count: number }>`
      SELECT COUNT(*) as count FROM payment_orders 
      WHERE status IN ('acknowledge', 'approval', 'last_approval', 'verification')
    `;

    // Get completed orders
    const completedResult = await paymentDB.queryRow<{ count: number }>`
      SELECT COUNT(*) as count FROM payment_orders WHERE status = 'paid'
    `;

    // Get total amount
    const amountResult = await paymentDB.queryRow<{ total: number }>`
      SELECT COALESCE(SUM(amount), 0) as total FROM payment_orders WHERE status = 'paid'
    `;

    // Get status breakdown
    const statusBreakdown = await paymentDB.queryAll<{ status: string; count: number }>`
      SELECT status, COUNT(*) as count 
      FROM payment_orders 
      GROUP BY status 
      ORDER BY count DESC
    `;

    // Get department breakdown
    const departmentBreakdown = await paymentDB.queryAll<{ department: string; count: number }>`
      SELECT department, COUNT(*) as count 
      FROM payment_orders 
      GROUP BY department 
      ORDER BY count DESC
    `;

    // Get recent orders
    const recentOrders = await paymentDB.queryAll<any>`
      SELECT 
        po.id,
        po.po_number,
        po.vendor_name,
        po.project_name,
        po.amount,
        po.status,
        po.department,
        po.created_at,
        u.name as created_by_name
      FROM payment_orders po
      JOIN users u ON po.created_by = u.id
      ORDER BY po.created_at DESC
      LIMIT 10
    `;

    const stats: DashboardStats = {
      total_orders: totalResult?.count || 0,
      pending_approval: pendingResult?.count || 0,
      completed_orders: completedResult?.count || 0,
      total_amount: amountResult?.total || 0,
      status_breakdown: statusBreakdown,
      department_breakdown: departmentBreakdown,
      recent_orders: recentOrders
    };

    return { stats };
  }
);
