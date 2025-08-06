import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";

export interface UserInfo {
  id: string;
  email: string;
  name: string;
  role: string;
}

// Returns information about the currently authenticated user.
export const me = api<void, UserInfo>(
  { auth: true, expose: true, method: "GET", path: "/auth/me" },
  async () => {
    const auth = getAuthData()!; // guaranteed to be non-null since `auth: true` is set.
    return {
      id: auth.userID,
      email: auth.email,
      name: auth.name,
      role: auth.role,
    };
  }
);
