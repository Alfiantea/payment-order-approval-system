import { api } from "encore.dev/api";
import { paymentDB } from "./db";
import type { User } from "./types";

export interface ListUsersResponse {
  users: User[];
}

// Retrieves all users.
export const listUsers = api<void, ListUsersResponse>(
  { expose: true, method: "GET", path: "/users" },
  async () => {
    const users = await paymentDB.queryAll<User>`
      SELECT * FROM users ORDER BY name ASC
    `;

    return { users };
  }
);
