import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { cookies } from "next/headers";
import { isAdminEmail } from "@/lib/admin";

const PENDING_COLLECTIONS: Record<string, string> = {
  donation: "pending_donations",
  foodsupport: "pending_foodsupport",
  medicalaid: "pending_medicalaid",
  clothing: "pending_clothing",
};

function normalizeDocs(type: string, docs: Array<any>) {
  return docs.map((doc) => {
    const { _id, ...rest } = doc;
    return { id: String(_id), type, ...rest };
  });
}

export async function GET() {
  try {
    const db = await getDb();

    // ✅ ADMIN GUARD (add this block)
    const sessionId = (await cookies()).get("sessionId")?.value;
    if (!sessionId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // sessions collection name + field name MUST match your backend
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
    
    const [donations, foodsupport, medicalaid, clothing] = await Promise.all([
      db.collection(PENDING_COLLECTIONS.donation).find().sort({ createdAt: -1 }).limit(50).toArray(),
      db.collection(PENDING_COLLECTIONS.foodsupport).find().sort({ createdAt: -1 }).limit(50).toArray(),
      db.collection(PENDING_COLLECTIONS.medicalaid).find().sort({ createdAt: -1 }).limit(50).toArray(),
      db.collection(PENDING_COLLECTIONS.clothing).find().sort({ createdAt: -1 }).limit(50).toArray(),
    ]);

    return NextResponse.json({
      ok: true,
      data: {
        donation: normalizeDocs("donation", donations),
        foodsupport: normalizeDocs("foodsupport", foodsupport),
        medicalaid: normalizeDocs("medicalaid", medicalaid),
        clothing: normalizeDocs("clothing", clothing),
      },
    });
  } catch (err) {
    console.error("/api/admin/pending GET error", err);
    return NextResponse.json({ ok: false, error: "DB error" }, { status: 500 });
  }
}
