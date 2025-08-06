import { Header, Cookie, APIError, Gateway } from "encore.dev/api";
import { authHandler } from "encore.dev/auth";
import { secret } from "encore.dev/config";
import { paymentDB } from "../payment/db";
import type { User } from "../payment/types";

const jwtSecret = secret("JWTSecret");

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
      // Simple token verification - in production, use proper JWT library
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error("Invalid token format");
      }
      
      // For now, we'll extract user ID from a simple token format: "user_id.timestamp.signature"
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

// Utility functions for password hashing and token generation
export async function hashPassword(password: string): Promise<string> {
  // Simple hash implementation - in production, use proper bcrypt
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "salt123");
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  const hashedInput = await hashPassword(password);
  return hashedInput === hashedPassword;
}

export function generateToken(userId: number): string {
  // Simple token format: userId.timestamp.signature
  const timestamp = Date.now();
  const signature = Math.random().toString(36).substring(2);
  return `${userId}.${timestamp}.${signature}`;
}
