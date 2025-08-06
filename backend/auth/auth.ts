import { Header, Cookie, APIError, Gateway } from "encore.dev/api";
import { authHandler } from "encore.dev/auth";
import { secret } from "encore.dev/config";
import { paymentDB } from "../payment/db";
import * as bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
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
      const decoded = jwt.verify(token, jwtSecret()) as any;
      
      // Get user from database
      const user = await paymentDB.queryRow<User>`
        SELECT * FROM users WHERE id = ${decoded.userId}
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

// Utility functions for password hashing and JWT
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(userId: number): string {
  return jwt.sign({ userId }, jwtSecret(), { expiresIn: '7d' });
}
