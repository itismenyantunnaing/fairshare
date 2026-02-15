import { NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";
import { cookies } from "next/headers";
import { isAdminEmail } from "@/lib/admin";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "FairShare";

let clientPromise: Promise<MongoClient> | null = null;

function getClient() {
  if (!uri) throw new Error("Missing MONGODB_URI in environment variables.");
  if (!clientPromise) {
    const client = new MongoClient(uri);
    clientPromise = client.connect();
  }
  return clientPromise;
}

type ItemType = "donation" | "foodsupport" | "medicalaid" | "clothing";

const PENDING_COLLECTIONS: Record<ItemType, string> = {
  donation: "pending_donations",
  foodsupport: "pending_foodsupport",
  medicalaid: "pending_medicalaid",
  clothing: "pending_clothing",
};

const DECLINED_COLLECTIONS: Record<ItemType, string> = {
  donation: "declined_donations",
  foodsupport: "declined_foodsupport",
  medicalaid: "declined_medicalaid",
  clothing: "declined_clothing",
};

async function requireAdmin(db: any) {
  const sessionId = (await cookies()).get("sessionId")?.value;
  if (!sessionId) return { ok: false as const, status: 401 as const, error: "Unauthorized" };

  // ✅ IMPORTANT: match your approved/route.ts
  const session = await db.collection("sessions").findOne({ sessionId });
  if (!session?.userId) return { ok: false as const, status: 401 as const, error: "Unauthorized" };

  const user = await db.collection("donar_account").findOne({ _id: session.userId });
  const email = user?.email;

  if (!isAdminEmail(email)) return { ok: false as const, status: 403 as const, error: "Forbidden" };

  return { ok: true as const, adminEmail: email };
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const type = body?.type as ItemType;
    const id = body?.id as string;
    const reason = (body?.reason as string) || "";

    if (!type || !id) return NextResponse.json({ ok: false, error: "Missing type or id" }, { status: 400 });
    if (!["donation", "foodsupport", "medicalaid", "clothing"].includes(type))
      return NextResponse.json({ ok: false, error: "Invalid type" }, { status: 400 });

    const client = await getClient();
    const db = client.db(dbName);

    const auth = await requireAdmin(db);
    if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

    const pendingCol = db.collection(PENDING_COLLECTIONS[type]);
    const declinedCol = db.collection(DECLINED_COLLECTIONS[type]);

    const _id = new ObjectId(id);
    const doc = await pendingCol.findOne({ _id });
    if (!doc) return NextResponse.json({ ok: false, error: "Not found in pending" }, { status: 404 });

    const now = new Date();

    // copy doc into declined_*
    await declinedCol.insertOne({
      ...doc,
      pendingId: String(doc._id),
      status: "declined",
      declineReason: reason,
      declinedAt: now,
      declinedBy: auth.adminEmail,
    });

    // remove from pending_*
    await pendingCol.deleteOne({ _id });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("POST /api/admin/decline failed:", err);
    return NextResponse.json({ ok: false, error: err?.message || "Decline failed" }, { status: 500 });
  }
}
