import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET;
const COOKIE_NAME = "fairshare_token";

/**
 * Hash a plain-text password.
 */
export async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

/**
 * Compare a plain-text password against a bcrypt hash.
 */
export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Sign a JWT with the given payload. Expires in 7 days.
 */
export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

/**
 * Verify and decode a JWT. Returns the decoded payload or null.
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

/**
 * Read the JWT from the cookie and return the session data.
 * Returns decoded payload (includes `role` field) or null if not authenticated.
 * Possible roles: "super_admin", "admin", "shelter"
 */
export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/**
 * Create a Set-Cookie header value for the JWT token.
 */
export function createTokenCookie(token) {
  const maxAge = 7 * 24 * 60 * 60; // 7 days in seconds
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
}

/**
 * Create a Set-Cookie header value that clears the JWT cookie.
 */
export function clearTokenCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
