import { cookies } from "next/headers";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import { and, eq, gt } from "drizzle-orm";
const COOKIE = "openmt_session";

// A LAN deployment normally runs over http://<host>:3000. Secure cookies are
// only valid over HTTPS, so make that choice explicit instead of tying it to
// NODE_ENV (the Docker image is production-mode even for HTTP-only LAN use).
const SECURE_COOKIE = process.env.AUTH_COOKIE_SECURE === "true";
export function hashPassword(password: string) { return scryptSync(password, "openmt-password-salt", 64).toString("hex"); }
export function verifyPassword(password: string, hash: string) { const actual = Buffer.from(hash, "hex"); const expected = scryptSync(password, "openmt-password-salt", 64); return actual.length === expected.length && timingSafeEqual(actual, expected); }
export async function getCurrentUser() { const token = (await cookies()).get(COOKIE)?.value; if (!token) return null; const [row] = await db.select({ user: users }).from(sessions).innerJoin(users, eq(sessions.userId, users.id)).where(and(eq(sessions.id, token), gt(sessions.expiresAt, new Date()))).limit(1); return row?.user ?? null; }
export async function createSession(userId: string) { const id = randomBytes(32).toString("hex"); await db.insert(sessions).values({ id, userId, expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30) }); (await cookies()).set(COOKIE, id, { httpOnly: true, sameSite: "lax", secure: SECURE_COOKIE, path: "/", maxAge: 60 * 60 * 24 * 30 }); }
export async function clearSession() { const token = (await cookies()).get(COOKIE)?.value; if (token) await db.delete(sessions).where(eq(sessions.id, token)); (await cookies()).delete(COOKIE); }
