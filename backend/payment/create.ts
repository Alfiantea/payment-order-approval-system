import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { paymentDB } from "./db";
import type { PaymentOrder, POType, Department, POItem } from "./types";

export interface CreatePOItemRequest {
  description: string;
  quantity: number;
  unit_price: number;
  unit: string;
}

export interface CreatePaymentOrderRequest {
  vendor_name: string;
  due_date: Date;
  description?: string;
  po_type: POType;
  department: Department;
  project_name: string;
  po_date: Date;
  acknowledge_by?: number;
  approval_by?: number;
  items: CreatePOItemRequest[];
}

export interface CreatePaymentOrderResponse {
  payment_order: PaymentOrder;
}

// Creates a new payment order.
export const create = api<CreatePaymentOrderRequest, CreatePaymentOrderResponse>(
  { expose: true, method: "POST", path: "/payment-orders", auth: true },
  async (req) => {
    const auth = getAuthData()!;
    const created_by = parseInt(auth.userID);

    // Validate items
    if (!req.items || req.items.length === 0) {
      throw new Error("At least one item is required");
    }

    // Calculate total amount
    const totalAmount = req.items.reduce((sum, item) => {
      const itemTotal = item.quantity * item.unit_price;
      return sum + itemTotal;
    }, 0);

    // Generate PO number
    const poNumber = `PO-${Date.now()}`;
    
    // Begin transaction
    await paymentDB.exec`BEGIN`;
    
    try {
      // Insert payment order
      const paymentOrder = await paymentDB.queryRow<PaymentOrder>`
        INSERT INTO payment_orders (
          po_number, vendor_name, amount, due_date, description, 
          po_type, department, project_name, po_date, 
          acknowledge_by, approval_by, created_by
        )
        VALUES (
          ${poNumber}, ${req.vendor_name}, ${totalAmount}, ${req.due_date}, ${req.description},
          ${req.po_type}, ${req.department}, ${req.project_name}, ${req.po_date},
          ${req.acknowledge_by}, ${req.approval_by}, ${created_by}
        )
        RETURNING *
      `;

      if (!paymentOrder) {
        throw new Error("Failed to create payment order");
      }

      // Insert PO items
      for (const item of req.items) {
        const totalPrice = item.quantity * item.unit_price;
        await paymentDB.exec`
          INSERT INTO po_items (payment_order_id, description, quantity, unit_price, total_price, unit)
          VALUES (${paymentOrder.id}, ${item.description}, ${item.quantity}, ${item.unit_price}, ${totalPrice}, ${item.unit})
        `;
      }

      // Add history entry
      await paymentDB.exec`
        INSERT INTO payment_order_history (payment_order_id, status, action, user_id, comments)
        VALUES (${paymentOrder.id}, 'draft', 'Created payment order', ${created_by}, 'Payment order created')
      `;

      await paymentDB.exec`COMMIT`;

      return { payment_order: paymentOrder };
    } catch (error) {
      await paymentDB.exec`ROLLBACK`;
      throw error;
    }
  }
);
