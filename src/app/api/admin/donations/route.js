import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

/**
 * GET /api/admin/donations
 * List all donations. Query: ?status=pending|approved|rejected (optional).
 * Admin/super_admin only.
 */
export async function GET(req) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "super_admin")) {
      return NextResponse.json(
        { success: false, error: "ဝင်ရောက်ခွင့် မရှိပါ။" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const client = await clientPromise;
    const db = client.db("FairShare");

    const filter = {};
    if (status && ["pending", "approved", "rejected"].includes(status)) {
      filter.status = status;
    }
    // Donations already included in a distribution are hidden from the donation list
    filter.$or = [{ distributionId: { $exists: false } }, { distributionId: null }];

    const donations = await db
      .collection("donations")
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    const totalFoodPyiMatch = { category: "food", status: "approved", $or: [{ distributionId: { $exists: false } }, { distributionId: null }] };
    const totalFoodPyiResult = await db
      .collection("donations")
      .aggregate([
        { $match: totalFoodPyiMatch },
        { $group: { _id: null, total: { $sum: "$totalPyi" } } },
      ])
      .toArray();
    const totalFoodPyi = totalFoodPyiResult[0]?.total ?? 0;

    return NextResponse.json({
      success: true,
      donations: donations.map((d) => ({
        ...d,
        id: d._id.toString(),
      })),
      totalFoodPyi,
    });
  } catch (e) {
    console.error("Admin donations GET error:", e);
    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500 }
    );
  }
}
