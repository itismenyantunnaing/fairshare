import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { cookies } from "next/headers";
import { isAdminEmail } from "@/lib/admin";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "fairshare";

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

const DECLINED_COLLECTIONS: Record<ItemType, string> = {
  donation: "declined_donations",
  foodsupport: "declined_foodsupport",
  medicalaid: "declined_medicalaid",
  clothing: "declined_clothing",
};

export async function GET() {
  try {
    const client = await getClient();
    const db = client.db(dbName);

    // ✅ ADMIN GUARD (same as approved)
    const sessionId = (await cookies()).get("sessionId")?.value;
    if (!sessionId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const session = await db.collection("sessions").findOne({ sessionId });
    if (!session?.userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const user = await db.collection("donar_account").findOne({ _id: session.userId });
    const email = user?.email;

    if (!isAdminEmail(email)) return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    // ✅ END GUARD

    const [donations, foodsupport, medicalaid, clothing] = await Promise.all([
      db.collection(DECLINED_COLLECTIONS.donation).find({}).sort({ declinedAt: -1, createdAt: -1 }).limit(200).toArray(),
      db.collection(DECLINED_COLLECTIONS.foodsupport).find({}).sort({ declinedAt: -1, createdAt: -1 }).limit(200).toArray(),
      db.collection(DECLINED_COLLECTIONS.medicalaid).find({}).sort({ declinedAt: -1, createdAt: -1 }).limit(200).toArray(),
      db.collection(DECLINED_COLLECTIONS.clothing).find({}).sort({ declinedAt: -1, createdAt: -1 }).limit(200).toArray(),
    ]);

    const normalize = (type: ItemType, docs: any[]) =>
      docs.map((d) => ({
        ...d,
        id: String(d?._id),
        type,
      }));

    return NextResponse.json({
      ok: true,
      donations: normalize("donation", donations),
      foodsupport: normalize("foodsupport", foodsupport),
      medicalaid: normalize("medicalaid", medicalaid),
      clothing: normalize("clothing", clothing),
    });
  } catch (err: any) {
    console.error("GET /api/admin/declined failed:", err);
    return NextResponse.json({ ok: false, error: err?.message || "Failed to load declined items" }, { status: 500 });
  }
}
