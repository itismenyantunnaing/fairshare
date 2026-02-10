import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const db = await getDb();
    const result = await db.collection("pending_foodsupport").insertOne({
      ...body,
      createdAt: new Date(),
    });
    return NextResponse.json({ ok: true, id: String(result.insertedId) }, { status: 201 });
  } catch (err) {
    console.error("/api/pending_foodsupport POST error", err);
    return NextResponse.json({ ok: false, error: "DB error" }, { status: 500 });
  }
}
