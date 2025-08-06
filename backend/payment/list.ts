import { api } from "encore.dev/api";
import { Query } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { paymentDB } from "./db";
import type { PaymentOrder, PaymentOrderStatus, Department } from "./types";

export interface ListPaymentOrdersRequest {
  status?: Query<PaymentOrderStatus>;
  department?: Query<Department>;
  search?: Query<string>;
  limit?: Query<number>;
  offset?: Query<number>;
}

export interface ListPaymentOrdersResponse {
  payment_orders: (PaymentOrder & { created_by_name: string; acknowledge_by_name?: string; approval_by_name?: string })[];
  total: number;
}

// Retrieves all payment orders with optional filtering.
export const list = api<ListPaymentOrdersRequest, ListPaymentOrdersResponse>(
  { expose: true, method: "GET", path: "/payment-orders", auth: true },
  async (req) => {
    const auth = getAuthData()!;
    const limit = req.limit || 50;
    const offset = req.offset || 0;
    
    let whereClause = "WHERE 1=1";
    const params: any[] = [];
    let paramIndex = 1;

    if (req.status) {
      whereClause += ` AND po.status = $${paramIndex}`;
      params.push(req.status);
      paramIndex++;
    }

    if (req.department) {
      whereClause += ` AND po.department = $${paramIndex}`;
      params.push(req.department);
      paramIndex++;
    }

    if (req.search) {
      whereClause += ` AND (po.vendor_name ILIKE $${paramIndex} OR po.project_name ILIKE $${paramIndex} OR po.po_number ILIKE $${paramIndex})`;
      params.push(`%${req.search}%`);
      paramIndex++;
    }

    const query = `
      SELECT 
        po.*,
        u1.name as created_by_name,
        u2.name as acknowledge_by_name,
        u3.name as approval_by_name
      FROM payment_orders po
      JOIN users u1 ON po.created_by = u1.id
      LEFT JOIN users u2 ON po.acknowledge_by = u2.id
      LEFT JOIN users u3 ON po.approval_by = u3.id
      ${whereClause}
      ORDER BY po.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM payment_orders po
      ${whereClause}
    `;

    params.push(limit, offset);
    const countParams = params.slice(0, -2);

    const paymentOrders = await paymentDB.rawQueryAll<PaymentOrder & { created_by_name: string; acknowledge_by_name?: string; approval_by_name?: string }>(query, ...params);
    const countResult = await paymentDB.rawQueryRow<{ total: number }>(countQuery, ...countParams);

    return {
      payment_orders: paymentOrders,
      total: countResult?.total || 0
    };
  }
);
