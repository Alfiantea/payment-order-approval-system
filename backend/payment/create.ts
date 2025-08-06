import { api } from "encore.dev/api";
import { paymentDB } from "./db";
import type { PaymentOrder } from "./types";

export interface CreatePaymentOrderRequest {
  vendor_name: string;
  vendor_email?: string;
  amount: number;
  currency: string;
  due_date: Date;
  description?: string;
  created_by: number;
}

export interface CreatePaymentOrderResponse {
  payment_order: PaymentOrder;
}

// Creates a new payment order.
export const create = api<CreatePaymentOrderRequest, CreatePaymentOrderResponse>(
  { expose: true, method: "POST", path: "/payment-orders" },
  async (req) => {
    // Generate PO number
    const poNumber = `PO-${Date.now()}`;
    
    // Insert payment order
    const paymentOrder = await paymentDB.queryRow<PaymentOrder>`
      INSERT INTO payment_orders (po_number, vendor_name, vendor_email, amount, currency, due_date, description, created_by)
      VALUES (${poNumber}, ${req.vendor_name}, ${req.vendor_email}, ${req.amount}, ${req.currency}, ${req.due_date}, ${req.description}, ${req.created_by})
      RETURNING *
    `;

    if (!paymentOrder) {
      throw new Error("Failed to create payment order");
    }

    // Add history entry
    await paymentDB.exec`
      INSERT INTO payment_order_history (payment_order_id, status, action, user_id, comments)
      VALUES (${paymentOrder.id}, 'draft', 'Created payment order', ${req.created_by}, 'Payment order created')
    `;

    return { payment_order: paymentOrder };
  }
);
