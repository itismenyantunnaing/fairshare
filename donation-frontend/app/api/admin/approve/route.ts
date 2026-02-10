import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { cookies } from "next/headers";
import { isAdminEmail } from "@/lib/admin";

const COLLECTION_MAP: Record<string, { pending: string; approved: string }> = {
  donation: { pending: "pending_donations", approved: "approved_donations" },
  foodsupport: { pending: "pending_foodsupport", approved: "approved_foodsupport" },
  medicalaid: { pending: "pending_medicalaid", approved: "approved_medicalaid" },
  clothing: { pending: "pending_clothing", approved: "approved_clothing" },
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const type = body?.type as string | undefined;
    const id = body?.id as string | undefined;

    if (!type || !id) {
      return NextResponse.json({ ok: false, error: "missing type or id" }, { status: 400 });
    }

    const map = COLLECTION_MAP[type];
    if (!map) {
      return NextResponse.json({ ok: false, error: "invalid type" }, { status: 400 });
    }

    const db = await getDb();
    const _id = new ObjectId(id);
    const pendingDoc = await db.collection(map.pending).findOne({ _id });

      // ✅ ADMIN GUARD
    const sessionId = (await cookies()).get("sessionId")?.value;
    if (!sessionId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Your project likely stores sessions by sessionId field (not _id)
    const session = await db.collection("sessions").findOne({ sessionId });
    if (!session?.userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.collection("donar_account").findOne({ _id: session.userId });
    const email = user?.email;

    if (!isAdminEmail(email)) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }
    // ✅ END ADMIN GUARD
    
    if (!pendingDoc) {
      return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });
    }

    const { _id: pendingId, ...rest } = pendingDoc as any;
    const approvedDoc = {
      ...rest,
      pendingId,
      status: "approved",
      approvedAt: new Date(),
    };

    const insertRes = await db.collection(map.approved).insertOne(approvedDoc);
    if (!insertRes.acknowledged) {
      return NextResponse.json({ ok: false, error: "insert failed" }, { status: 500 });
    }

    await db.collection(map.pending).deleteOne({ _id: pendingId });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("/api/admin/approve POST error", err);
    return NextResponse.json({ ok: false, error: "DB error" }, { status: 500 });
  }
}
