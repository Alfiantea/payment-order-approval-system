// Simple token generation without JWT
export function generateToken(userId: number): string {
  // Simple token format: userId.timestamp.signature
  const timestamp = Date.now();
  const signature = Math.random().toString(36).substring(2);
  return `${userId}.${timestamp}.${signature}`;
}
