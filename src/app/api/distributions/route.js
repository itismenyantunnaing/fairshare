import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

/**
 * GET /api/distributions
 * List all distributions (for donor and shelter). Requires auth as donor or shelter.
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "ဝင်ရောက်ခွင့် မရှိပါ။" },
        { status: 401 }
      );
    }
    const role = session.role;
    if (role !== "donor" && role !== "shelter") {
      return NextResponse.json(
        { success: false, error: "ဝင်ရောက်ခွင့် မရှိပါ။" },
        { status: 403 }
      );
    }

    const client = await clientPromise;
    const db = client.db("FairShare");

    const distributions = await db
      .collection("distributions")
      .find({})
      .project({
        name: 1,
        startDate: 1,
        endDate: 1,
        scheduleType: 1,
        createdAt: 1,
      })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      distributions: distributions.map((d) => ({
        id: d._id.toString(),
        name: d.name || "ဖြန့်ဝေမှု",
        startDate: d.startDate,
        endDate: d.endDate,
        scheduleType: d.scheduleType,
        createdAt: d.createdAt,
      })),
    });
  } catch (e) {
    console.error("GET distributions error:", e);
    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500 }
    );
  }
}
