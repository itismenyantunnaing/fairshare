import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(req: Request) {
  try {
    const text = await req.text();
    let body: any;
    try {
      body = JSON.parse(text);
    } catch (parseErr) {
      console.error("/api/pending_donation POST parse error raw body:", text);

      // In development only: attempt to evaluate JS-like object literal (helps debugging PowerShell/curl quirks)
      if (process.env.NODE_ENV === "development") {
        try {
          let toEval = text.trim();
          if (toEval.startsWith("'") && toEval.endsWith("'")) {
            toEval = toEval.slice(1, -1);
          }
          // Wrap in parentheses to force expression
          const fn = new Function(`"use strict"; return (${toEval});`);
          const obj = fn();
          body = obj;
          console.warn("/api/pending_donation POST accepted eval'd body (dev only)", obj);
        } catch (evalErr) {
          console.error("/api/pending_donation POST eval failed", evalErr);
          return NextResponse.json({ ok: false, error: "Invalid JSON", raw: text }, { status: 400 });
        }
      } else {
        return NextResponse.json({ ok: false, error: "Invalid JSON", raw: text }, { status: 400 });
      }
    }
    const db = await getDb();
    const result = await db.collection("pending_donations").insertOne({
      ...body,
      createdAt: new Date(),
    });
    return NextResponse.json({ ok: true, id: String(result.insertedId) }, { status: 201 });
  } catch (err) {
    console.error("/api/pending_donation POST error", err);
    return NextResponse.json({ ok: false, error: "DB error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const db = await getDb();

    if (!body.id) {
      return NextResponse.json({ ok: false, error: "missing id" }, { status: 400 });
    }

    const _id = new ObjectId(body.id);
    const update: any = { updatedAt: new Date() };
    if (body.status) update.status = body.status;
    if (body.transactionId) update.transactionId = body.transactionId;

    const res = await db.collection("pending_donations").updateOne({ _id }, { $set: update });
    if (res.matchedCount === 0) {
      return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, matched: res.matchedCount });
  } catch (err) {
    console.error("/api/pending_donation PATCH error", err);
    return NextResponse.json({ ok: false, error: "DB error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const db = await getDb();
    const items = await db
      .collection("pending_donations")
      .find()
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();
    return NextResponse.json(items);
  } catch (err) {
    console.error("/api/pending_donation GET error", err);
    return NextResponse.json({ ok: false, error: "DB error" }, { status: 500 });
  }
}
