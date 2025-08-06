import { api } from "encore.dev/api";
import { Query } from "encore.dev/api";
import { paymentDB } from "./db";
import type { PaymentOrder, PaymentOrderStatus } from "./types";

export interface ListPaymentOrdersRequest {
  status?: Query<PaymentOrderStatus>;
  vendor?: Query<string>;
  limit?: Query<number>;
  offset?: Query<number>;
}

export interface ListPaymentOrdersResponse {
  payment_orders: (PaymentOrder & { created_by_name: string })[];
  total: number;
}

// Retrieves all payment orders with optional filtering.
export const list = api<ListPaymentOrdersRequest, ListPaymentOrdersResponse>(
  { expose: true, method: "GET", path: "/payment-orders" },
  async (req) => {
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

    if (req.vendor) {
      whereClause += ` AND po.vendor_name ILIKE $${paramIndex}`;
      params.push(`%${req.vendor}%`);
      paramIndex++;
    }

    const query = `
      SELECT 
        po.*,
        u.name as created_by_name
      FROM payment_orders po
      JOIN users u ON po.created_by = u.id
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

    const paymentOrders = await paymentDB.rawQueryAll<PaymentOrder & { created_by_name: string }>(query, ...params);
    const countResult = await paymentDB.rawQueryRow<{ total: number }>(countQuery, ...countParams);

    return {
      payment_orders: paymentOrders,
      total: countResult?.total || 0
    };
  }
);
