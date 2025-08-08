import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { paymentDB } from "./db";
import type { PaymentOrder, PaymentOrderStatus, User } from "./types";

export interface UpdateStatusRequest {
  id: number;
  status: PaymentOrderStatus;
  comments?: string;
}

export interface UpdateStatusResponse {
  payment_order: PaymentOrder;
}

// Updates the status of a payment order.
export const updateStatus = api<UpdateStatusRequest, UpdateStatusResponse>(
  { expose: true, method: "PUT", path: "/payment-orders/:id/status", auth: true },
  async (req) => {
    const auth = getAuthData()!;
    const user_id = parseInt(auth.userID);

    // Get user data
    const user = await paymentDB.queryRow<User>`
      SELECT * FROM users WHERE id = ${user_id}
    `;
    if (!user) {
      throw APIError.unauthenticated("User not found");
    }

    // Validate status transition
    const currentPO = await paymentDB.queryRow<PaymentOrder>`
      SELECT * FROM payment_orders WHERE id = ${req.id}
    `;

    if (!currentPO) {
      throw APIError.notFound("Payment order not found");
    }

    // Define valid status transitions based on user role
    const validTransitions: Record<PaymentOrderStatus, PaymentOrderStatus[]> = {
      draft: user.role === 'staff' ? ['acknowledge', 'rejected'] : [],
      acknowledge: user.role === 'acknowledger' ? ['approval', 'rejected'] : [],
      approval: user.role === 'approver' ? ['posting', 'rejected'] : [],
      posting: user.role === 'accounting_staff' ? ['scheduling', 'rejected'] : [],
      scheduling: user.role === 'finance_staff' ? ['last_approval', 'rejected'] : [],
      last_approval: user.role === 'final_approver' ? ['verification', 'rejected'] : [],
      verification: user.role === 'verifier' ? ['release_payment', 'rejected'] : [],
      release_payment: user.role === 'finance_staff' ? ['paid'] : [],
      paid: [],
      rejected: ['draft'] // Can restart from draft
    };

    // Admin can do any transition
    if (user.role === 'admin') {
      const allTransitions: Record<PaymentOrderStatus, PaymentOrderStatus[]> = {
        draft: ['acknowledge', 'rejected'],
        acknowledge: ['approval', 'rejected'],
        approval: ['posting', 'rejected'],
        posting: ['scheduling', 'rejected'],
        scheduling: ['last_approval', 'rejected'],
        last_approval: ['verification', 'rejected'],
        verification: ['release_payment', 'rejected'],
        release_payment: ['paid'],
        paid: [],
        rejected: ['draft']
      };
      if (!allTransitions[currentPO.status].includes(req.status)) {
        throw APIError.invalidArgument(`Invalid status transition from ${currentPO.status} to ${req.status}`);
      }
    } else {
      if (!validTransitions[currentPO.status].includes(req.status)) {
        throw APIError.invalidArgument(`Invalid status transition from ${currentPO.status} to ${req.status}`);
      }
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
      VALUES (${req.id}, ${req.status}, ${action}, ${user_id}, ${req.comments})
    `;

    return { payment_order: updatedPO };
  }
);
