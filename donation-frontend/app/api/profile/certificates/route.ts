import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET() {
  try {
    const db = await getDb();
    const sessionId = (await cookies()).get("sessionId")?.value;

    if (!sessionId) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const session = await db.collection("sessions").findOne({ sessionId });
    if (!session?.userId) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const user = await db
      .collection("donar_account")
      .findOne({ _id: new ObjectId(session.userId) });

    if (!user?.email) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const certificates = await db
      .collection("certificates")
      .find({ donorEmail: user.email })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ ok: true, certificates });
  } catch (err) {
    console.error("Profile certificates error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
