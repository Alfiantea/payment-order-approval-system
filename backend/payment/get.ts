import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { paymentDB } from "./db";
import type { PaymentOrderWithDetails, POItem } from "./types";

export interface GetPaymentOrderRequest {
  id: number;
}

// Retrieves a payment order with full details including history, attachments, and items.
export const get = api<GetPaymentOrderRequest, PaymentOrderWithDetails>(
  { expose: true, method: "GET", path: "/payment-orders/:id", auth: true },
  async (req) => {
    const auth = getAuthData()!;

    // Get payment order with user names
    const paymentOrder = await paymentDB.queryRow<PaymentOrderWithDetails>`
      SELECT 
        po.*,
        u1.name as created_by_name,
        u2.name as acknowledge_by_name,
        u3.name as approval_by_name
      FROM payment_orders po
      JOIN users u1 ON po.created_by = u1.id
      LEFT JOIN users u2 ON po.acknowledge_by = u2.id
      LEFT JOIN users u3 ON po.approval_by = u3.id
      WHERE po.id = ${req.id}
    `;

    if (!paymentOrder) {
      throw APIError.notFound("Payment order not found");
    }

    // Get history
    const history = await paymentDB.queryAll<any>`
      SELECT 
        h.*,
        u.name as user_name
      FROM payment_order_history h
      JOIN users u ON h.user_id = u.id
      WHERE h.payment_order_id = ${req.id}
      ORDER BY h.created_at ASC
    `;

    // Get attachments
    const attachments = await paymentDB.queryAll<any>`
      SELECT * FROM attachments
      WHERE payment_order_id = ${req.id}
      ORDER BY created_at ASC
    `;

    // Get PO items
    const items = await paymentDB.queryAll<POItem>`
      SELECT * FROM po_items
      WHERE payment_order_id = ${req.id}
      ORDER BY id ASC
    `;

    paymentOrder.history = history;
    paymentOrder.attachments = attachments;
    paymentOrder.items = items;

    return paymentOrder;
  }
);
