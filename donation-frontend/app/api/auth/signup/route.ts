import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { randomBytes, scryptSync } from "crypto";
import { createSession } from "@/lib/session";

type ReqBody = { name: string; email: string; password: string; profilePhoto?: string };

export async function POST(req: Request) {
  try {
    const body: ReqBody = await req.json();
    if (!body.email || !body.password) {
      return NextResponse.json({ ok: false, error: "Missing fields" }, { status: 400 });
    }

    const db = await getDb();
    const existing = await db.collection("donar_account").findOne({ email: body.email.toLowerCase() });
    if (existing) {
      return NextResponse.json({ ok: false, error: "Email already registered" }, { status: 409 });
    }

    const salt = randomBytes(16).toString("hex");
    const derived = scryptSync(body.password, salt, 64).toString("hex");

    const profilePhoto = body.profilePhoto && body.profilePhoto.trim() !== '' ? body.profilePhoto.trim() : '/default-avatar.svg';
    const doc = {
      name: body.name || null,
      email: body.email.toLowerCase(),
      passwordHash: derived,
      salt,
      profilePhoto,
      createdAt: new Date(),
    };

    const result = await db.collection("donar_account").insertOne(doc);

    // create server-side session and set HttpOnly cookie
    const { sessionId, maxAge } = await createSession(String(result.insertedId));
    const secure = process.env.NODE_ENV === 'production';
    const cookie = `sessionId=${sessionId}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure ? '; Secure' : ''}`;

    const profile = { id: String(result.insertedId), name: doc.name, email: doc.email, profilePhoto: doc.profilePhoto };
    return NextResponse.json({ ok: true, profile }, { status: 201, headers: { 'Set-Cookie': cookie } });
  } catch (err) {
    console.error("/api/auth/signup POST error", err);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
