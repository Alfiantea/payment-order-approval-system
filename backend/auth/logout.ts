import { api, Cookie } from "encore.dev/api";

export interface LogoutResponse {
  session: Cookie<"session">;
}

// Logs out the current user by clearing the session cookie.
export const logout = api<void, LogoutResponse>(
  { expose: true, method: "POST", path: "/auth/logout" },
  async () => {
    return {
      session: {
        value: "",
        expires: new Date(0), // Expire immediately
        httpOnly: true,
        secure: true,
        sameSite: "Lax",
      }
    };
  }
);
