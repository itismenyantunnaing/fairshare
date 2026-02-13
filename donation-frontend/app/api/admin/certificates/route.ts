import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { cookies } from "next/headers";
import { isAdminEmail } from "@/lib/admin";

async function requireAdmin(db: any) {
  const sessionId = (await cookies()).get("sessionId")?.value;
  if (!sessionId) return { ok: false, status: 401 as const, error: "Unauthorized" };

  const session = await db.collection("sessions").findOne({ sessionId });
  if (!session?.userId) return { ok: false, status: 401 as const, error: "Unauthorized" };

  const user = await db.collection("donar_account").findOne({ _id: session.userId });
  if (!isAdminEmail(user?.email)) return { ok: false, status: 403 as const, error: "Forbidden" };

  return { ok: true as const };
}

export async function GET() {
  try {
    const db = await getDb(process.env.MONGODB_DB);
    const auth = await requireAdmin(db);
    if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

    const rows = await db
      .collection("certificates")
      .find({})
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    const out = rows.map(({ _id, ...rest }: any) => ({ id: String(_id), ...rest }));
    return NextResponse.json({ ok: true, certificates: out });
  } catch (e: any) {
    console.error("GET /api/admin/certificates failed:", e);
    return NextResponse.json({ ok: false, error: e?.message || "Server error" }, { status: 500 });
  }
}
