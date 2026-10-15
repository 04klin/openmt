import { cookies } from "next/headers";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import { and, eq, gt } from "drizzle-orm";
const COOKIE = "openmt_session";
export function hashPassword(password: string) { return scryptSync(password, "openmt-password-salt", 64).toString("hex"); }
export function verifyPassword(password: string, hash: string) { const actual = Buffer.from(hash, "hex"); const expected = scryptSync(password, "openmt-password-salt", 64); return actual.length === expected.length && timingSafeEqual(actual, expected); }
export async function getCurrentUser() { const token = (await cookies()).get(COOKIE)?.value; if (!token) return null; const [row] = await db.select({ user: users }).from(sessions).innerJoin(users, eq(sessions.userId, users.id)).where(and(eq(sessions.id, token), gt(sessions.expiresAt, new Date()))).limit(1); return row?.user ?? null; }
export async function createSession(userId: string) { const id = randomBytes(32).toString("hex"); await db.insert(sessions).values({ id, userId, expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30) }); (await cookies()).set(COOKIE, id, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 30 }); }
export async function clearSession() { const token = (await cookies()).get(COOKIE)?.value; if (token) await db.delete(sessions).where(eq(sessions.id, token)); (await cookies()).delete(COOKIE); }
