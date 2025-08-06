import { api, APIError } from "encore.dev/api";
import { paymentDB } from "./db";
import type { User, UserRole } from "./types";

export interface CreateUserRequest {
  email: string;
  name: string;
  role: UserRole;
}

export interface UpdateUserRequest {
  id: number;
  email?: string;
  name?: string;
  role?: UserRole;
}

export interface DeleteUserRequest {
  id: number;
}

export interface CreateUserResponse {
  user: User;
}

export interface UpdateUserResponse {
  user: User;
}

// Creates a new user (admin only).
export const createUser = api<CreateUserRequest, CreateUserResponse>(
  { expose: true, method: "POST", path: "/admin/users" },
  async (req) => {
    // Check if email already exists
    const existingUser = await paymentDB.queryRow<User>`
      SELECT * FROM users WHERE email = ${req.email}
    `;

    if (existingUser) {
      throw APIError.alreadyExists("User with this email already exists");
    }

    // Create new user
    const user = await paymentDB.queryRow<User>`
      INSERT INTO users (email, name, role)
      VALUES (${req.email}, ${req.name}, ${req.role})
      RETURNING *
    `;

    if (!user) {
      throw APIError.internal("Failed to create user");
    }

    return { user };
  }
);

// Updates an existing user (admin only).
export const updateUser = api<UpdateUserRequest, UpdateUserResponse>(
  { expose: true, method: "PUT", path: "/admin/users/:id" },
  async (req) => {
    // Check if user exists
    const existingUser = await paymentDB.queryRow<User>`
      SELECT * FROM users WHERE id = ${req.id}
    `;

    if (!existingUser) {
      throw APIError.notFound("User not found");
    }

    // Check if email is being changed and if it already exists
    if (req.email && req.email !== existingUser.email) {
      const emailExists = await paymentDB.queryRow<User>`
        SELECT * FROM users WHERE email = ${req.email} AND id != ${req.id}
      `;

      if (emailExists) {
        throw APIError.alreadyExists("User with this email already exists");
      }
    }

    // Build update query dynamically
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (req.email !== undefined) {
      updates.push(`email = $${paramIndex}`);
      params.push(req.email);
      paramIndex++;
    }

    if (req.name !== undefined) {
      updates.push(`name = $${paramIndex}`);
      params.push(req.name);
      paramIndex++;
    }

    if (req.role !== undefined) {
      updates.push(`role = $${paramIndex}`);
      params.push(req.role);
      paramIndex++;
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(req.id);

    const query = `
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const user = await paymentDB.rawQueryRow<User>(query, ...params);

    if (!user) {
      throw APIError.internal("Failed to update user");
    }

    return { user };
  }
);

// Deletes a user (admin only).
export const deleteUser = api<DeleteUserRequest, void>(
  { expose: true, method: "DELETE", path: "/admin/users/:id" },
  async (req) => {
    // Check if user exists
    const existingUser = await paymentDB.queryRow<User>`
      SELECT * FROM users WHERE id = ${req.id}
    `;

    if (!existingUser) {
      throw APIError.notFound("User not found");
    }

    // Check if user has any payment orders
    const hasPaymentOrders = await paymentDB.queryRow<{ count: number }>`
      SELECT COUNT(*) as count FROM payment_orders 
      WHERE created_by = ${req.id} OR acknowledge_by = ${req.id} OR approval_by = ${req.id}
    `;

    if (hasPaymentOrders && hasPaymentOrders.count > 0) {
      throw APIError.failedPrecondition("Cannot delete user with associated payment orders");
    }

    // Check if user has any history entries
    const hasHistory = await paymentDB.queryRow<{ count: number }>`
      SELECT COUNT(*) as count FROM payment_order_history WHERE user_id = ${req.id}
    `;

    if (hasHistory && hasHistory.count > 0) {
      throw APIError.failedPrecondition("Cannot delete user with payment order history");
    }

    // Delete user
    await paymentDB.exec`DELETE FROM users WHERE id = ${req.id}`;
  }
);

// Gets user statistics (admin only).
export const getUserStats = api<void, { total_users: number; role_breakdown: { role: string; count: number }[] }>(
  { expose: true, method: "GET", path: "/admin/users/stats" },
  async () => {
    // Get total users
    const totalResult = await paymentDB.queryRow<{ count: number }>`
      SELECT COUNT(*) as count FROM users
    `;

    // Get role breakdown
    const roleBreakdown = await paymentDB.queryAll<{ role: string; count: number }>`
      SELECT role, COUNT(*) as count 
      FROM users 
      GROUP BY role 
      ORDER BY count DESC
    `;

    return {
      total_users: totalResult?.count || 0,
      role_breakdown: roleBreakdown
    };
  }
);
