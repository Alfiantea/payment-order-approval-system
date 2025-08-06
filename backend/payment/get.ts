import { api, APIError } from "encore.dev/api";
import { paymentDB } from "./db";
import type { PaymentOrderWithDetails } from "./types";

export interface GetPaymentOrderRequest {
  id: number;
}

// Retrieves a payment order with full details including history and attachments.
export const get = api<GetPaymentOrderRequest, PaymentOrderWithDetails>(
  { expose: true, method: "GET", path: "/payment-orders/:id" },
  async (req) => {
    // Get payment order with creator name
    const paymentOrder = await paymentDB.queryRow<PaymentOrderWithDetails>`
      SELECT 
        po.*,
        u.name as created_by_name
      FROM payment_orders po
      JOIN users u ON po.created_by = u.id
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

    paymentOrder.history = history;
    paymentOrder.attachments = attachments;

    return paymentOrder;
  }
);
