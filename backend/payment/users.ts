import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { paymentDB } from "./db";
import type { User } from "./types";

export interface ListUsersResponse {
  users: Omit<User, 'hashed_password'>[];
}

// Retrieves all users.
export const listUsers = api<void, ListUsersResponse>(
  { expose: true, method: "GET", path: "/users", auth: true },
  async () => {
    const auth = getAuthData()!;

    const users = await paymentDB.queryAll<User>`
      SELECT id, email, name, role, created_at, updated_at FROM users ORDER BY name ASC
    `;

    return { users };
  }
);
