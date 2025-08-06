import { api, APIError } from "encore.dev/api";
import { paymentDB } from "../payment/db";
import type { User, UserRole } from "../payment/types";

export interface RegisterRequest {
  email: string;
  name: string;
  password: string;
  role: UserRole;
}

export interface RegisterResponse {
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
  };
}

// Registers a new user (admin only).
export const register = api<RegisterRequest, RegisterResponse>(
  { expose: true, method: "POST", path: "/auth/register", auth: true },
  async (req) => {
    if (!req.email || !req.name || !req.password || !req.role) {
      throw APIError.invalidArgument("All fields are required");
    }

    if (req.password.length < 8) {
      throw APIError.invalidArgument("Password must be at least 8 characters long");
    }

    // Check if email already exists
    const existingUser = await paymentDB.queryRow<User>`
      SELECT * FROM users WHERE email = ${req.email}
    `;

    if (existingUser) {
      throw APIError.alreadyExists("User with this email already exists");
    }

    // Create new user with plain text password
    const user = await paymentDB.queryRow<User>`
      INSERT INTO users (email, name, role, password)
      VALUES (${req.email}, ${req.name}, ${req.role}, ${req.password})
      RETURNING *
    `;

    if (!user) {
      throw APIError.internal("Failed to create user");
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      }
    };
  }
);
