import { api, APIError, Cookie } from "encore.dev/api";
import { paymentDB } from "../payment/db";
import { verifyPassword, generateToken } from "./auth";
import type { User } from "../payment/types";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
  };
  token: string;
  session: Cookie<"session">;
}

// Authenticates a user and returns a session token.
export const login = api<LoginRequest, LoginResponse>(
  { expose: true, method: "POST", path: "/auth/login" },
  async (req) => {
    if (!req.email || !req.password) {
      throw APIError.invalidArgument("Email and password are required");
    }

    // Find user by email
    const user = await paymentDB.queryRow<User>`
      SELECT * FROM users WHERE email = ${req.email}
    `;

    if (!user) {
      throw APIError.unauthenticated("Invalid email or password");
    }

    if (!user.hashed_password) {
      throw APIError.unauthenticated("Account not properly configured");
    }

    // Verify password
    const isValidPassword = await verifyPassword(req.password, user.hashed_password);
    if (!isValidPassword) {
      throw APIError.unauthenticated("Invalid email or password");
    }

    // Generate token
    const token = generateToken(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
      session: {
        value: token,
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        httpOnly: true,
        secure: true,
        sameSite: "Lax",
      }
    };
  }
);
