import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { scryptSync, timingSafeEqual } from "crypto";
import { createSession } from "@/lib/session";

type ReqBody = { email: string; password: string };

export async function POST(req: Request) {
  try {
    const body: ReqBody = await req.json();
    if (!body.email || !body.password) {
      return NextResponse.json({ ok: false, error: "Missing fields" }, { status: 400 });
    }

    const db = await getDb();
    const user = await db.collection("donar_account").findOne({ email: body.email.toLowerCase() });
    if (!user) return NextResponse.json({ ok: false, error: "Invalid credentials" }, { status: 401 });

    const salt = user.salt as string;
    const derived = scryptSync(body.password, salt, 64);
    const stored = Buffer.from(user.passwordHash as string, "hex");

    if (stored.length !== derived.length) {
      return NextResponse.json({ ok: false, error: "Invalid credentials" }, { status: 401 });
    }

    if (!timingSafeEqual(stored, derived)) {
      return NextResponse.json({ ok: false, error: "Invalid credentials" }, { status: 401 });
    }

    // create server-side session and set HttpOnly cookie
    const { sessionId, maxAge } = await createSession(String(user._id));
    const secure = process.env.NODE_ENV === 'production';
    const cookie = `sessionId=${sessionId}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure ? '; Secure' : ''}`;

    const profile = { id: String(user._id), name: user.name || null, email: user.email, profilePhoto: user.profilePhoto || '/default-avatar.svg' };
    return NextResponse.json({ ok: true, profile }, { status: 200, headers: { 'Set-Cookie': cookie } });
  } catch (err) {
    console.error("/api/auth/login POST error", err);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
