import { api, APIError } from "encore.dev/api";
import { paymentDB } from "./db";
import type { PaymentOrder, PaymentOrderStatus } from "./types";

export interface UpdateStatusRequest {
  id: number;
  status: PaymentOrderStatus;
  user_id: number;
  comments?: string;
}

export interface UpdateStatusResponse {
  payment_order: PaymentOrder;
}

// Updates the status of a payment order.
export const updateStatus = api<UpdateStatusRequest, UpdateStatusResponse>(
  { expose: true, method: "PUT", path: "/payment-orders/:id/status" },
  async (req) => {
    // Validate status transition
    const currentPO = await paymentDB.queryRow<PaymentOrder>`
      SELECT * FROM payment_orders WHERE id = ${req.id}
    `;

    if (!currentPO) {
      throw APIError.notFound("Payment order not found");
    }

    // Define valid status transitions
    const validTransitions: Record<PaymentOrderStatus, PaymentOrderStatus[]> = {
      draft: ['acknowledge', 'rejected'],
      acknowledge: ['approval', 'rejected'],
      approval: ['posting', 'rejected'],
      posting: ['scheduling', 'rejected'],
      scheduling: ['last_approval', 'rejected'],
      last_approval: ['verification', 'rejected'],
      verification: ['release_payment', 'rejected'],
      release_payment: ['paid'],
      paid: [],
      rejected: ['draft'] // Can restart from draft
    };

    if (!validTransitions[currentPO.status].includes(req.status)) {
      throw APIError.invalidArgument(`Invalid status transition from ${currentPO.status} to ${req.status}`);
    }

    // Update payment order status
    const updatedPO = await paymentDB.queryRow<PaymentOrder>`
      UPDATE payment_orders 
      SET status = ${req.status}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${req.id}
      RETURNING *
    `;

    if (!updatedPO) {
      throw APIError.internal("Failed to update payment order");
    }

    // Add history entry
    const action = req.status === 'rejected' ? 'Rejected' : `Moved to ${req.status}`;
    await paymentDB.exec`
      INSERT INTO payment_order_history (payment_order_id, status, action, user_id, comments)
      VALUES (${req.id}, ${req.status}, ${action}, ${req.user_id}, ${req.comments})
    `;

    return { payment_order: updatedPO };
  }
);
