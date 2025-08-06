import { Header, Cookie, APIError, Gateway } from "encore.dev/api";
import { authHandler } from "encore.dev/auth";
import { paymentDB } from "../payment/db";
import type { User } from "../payment/types";

interface AuthParams {
  authorization?: Header<"Authorization">;
  session?: Cookie<"session">;
}

export interface AuthData {
  userID: string;
  email: string;
  name: string;
  role: string;
}

const auth = authHandler<AuthParams, AuthData>(
  async (data) => {
    // Resolve the authenticated user from the authorization header or session cookie.
    const token = data.authorization?.replace("Bearer ", "") ?? data.session?.value;
    if (!token) {
      throw APIError.unauthenticated("missing token");
    }

    try {
      // Simple token verification - token format: "user_id.timestamp.signature"
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error("Invalid token format");
      }
      
      const userId = parseInt(parts[0]);
      if (isNaN(userId)) {
        throw new Error("Invalid user ID in token");
      }
      
      // Get user from database
      const user = await paymentDB.queryRow<User>`
        SELECT * FROM users WHERE id = ${userId}
      `;

      if (!user) {
        throw APIError.unauthenticated("user not found");
      }

      return {
        userID: user.id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
      };
    } catch (err) {
      throw APIError.unauthenticated("invalid token", err);
    }
  }
);

// Configure the API gateway to use the auth handler.
export const gw = new Gateway({ authHandler: auth });

// Simple token generation without JWT
export function generateToken(userId: number): string {
  // Simple token format: userId.timestamp.signature
  const timestamp = Date.now();
  const signature = Math.random().toString(36).substring(2);
  return `${userId}.${timestamp}.${signature}`;
}
