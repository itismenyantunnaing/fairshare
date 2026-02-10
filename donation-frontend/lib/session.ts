import { getDb } from './mongodb';
import crypto from 'crypto';
import { ObjectId } from 'mongodb';

const DEFAULT_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

export async function createSession(userId: string, maxAge = DEFAULT_MAX_AGE) {
  const db = await getDb();
  const sessionId = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + maxAge * 1000);
  await db.collection('sessions').insertOne({ sessionId, userId: new ObjectId(userId), expiresAt });
  return { sessionId, expiresAt, maxAge };
}

export async function getSession(sessionId: string) {
  if (!sessionId) return null;
  const db = await getDb();
  const now = new Date();
  const s = await db.collection('sessions').findOne({ sessionId, expiresAt: { $gt: now } });
  return s || null;
}

export async function deleteSession(sessionId: string) {
  if (!sessionId) return;
  const db = await getDb();
  await db.collection('sessions').deleteOne({ sessionId });
}

export async function getUserFromSession(sessionId?: string | null) {
  if (!sessionId) return null;
  const s = await getSession(sessionId as string);
  if (!s) return null;
  const db = await getDb();
  // s.userId may already be an ObjectId or a string
  const userId = typeof s.userId === 'string' ? new ObjectId(s.userId) : s.userId;
  const user = await db.collection('donar_account').findOne({ _id: userId });
  if (!user) return null;
  return { id: String(user._id), name: user.name || null, email: user.email, profilePhoto: user.profilePhoto || '/default-avatar.svg' };
}
