import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

/**
 * GET /api/shelters/[id]/distributions-for-activity
 * List distributions this shelter is in and has not yet posted for.
 * Posting window: within one week from distribution startDate (startDate to startDate+7 days).
 * No expired date on distribution; only startDate is used for the activity deadline.
 */
export async function GET(req, context) {
  try {
    const session = await getSession();
    const params = context?.params != null ? await context.params : {};
    const id = params?.id;

    if (!session || session.role !== "shelter" || session.id !== id) {
      return NextResponse.json(
        { success: false, error: "ဝင်ရောက်ခွင့် မရှိပါ။" },
        { status: 401 }
      );
    }

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "ခိုလှုံရာအိမ် ID ပုံစံ မမှန်ကန်ပါ" },
        { status: 400 }
      );
    }

    const shelterId = new ObjectId(id);
    const client = await clientPromise;
    const db = client.db("FairShare");

    const shelter = await db.collection("hostels").findOne({ _id: shelterId });
    if (!shelter) {
      return NextResponse.json(
        { success: false, error: "ခိုလှုံရာအိမ် မတွေ့ပါ" },
        { status: 404 }
      );
    }

    const now = new Date();
    const oneWeekMs = 7 * 24 * 60 * 60 * 1000;

    // All distributions this shelter is in (no expired date; distribution has no expiry)
    const distributions = await db
      .collection("distributions")
      .find({ "allocations.shelterId": shelterId })
      .sort({ startDate: -1 })
      .toArray();

    const distributionIds = distributions.map((d) => d._id);

    // Already posted: activities for this shelter with distributionId in list
    const posted = await db
      .collection("activities")
      .find({
        shelterId,
        distributionId: { $in: distributionIds },
      })
      .toArray();

    const postedDistributionIds = new Set(posted.map((a) => a.distributionId?.toString()).filter(Boolean));

    // Only distributions not yet posted for, and within posting window: startDate <= now <= startDate+7 days
    const available = distributions.filter((d) => {
      if (postedDistributionIds.has(d._id.toString())) return false;
      const start = new Date(d.startDate);
      const windowEnd = new Date(start.getTime() + oneWeekMs);
      return now >= start && now <= windowEnd;
    });

    const list = available.map((d) => {
      const start = new Date(d.startDate);
      const windowEnd = new Date(start.getTime() + oneWeekMs);
      const withinDeadline = now >= start && now <= windowEnd;
      return {
        id: d._id.toString(),
        name: d.name || `ဖြန့်ဝေမှု (${d.scheduleType || "custom"})`,
        startDate: d.startDate,
        endDate: d.endDate,
        withinDeadline,
      };
    });

    return NextResponse.json({
      success: true,
      distributions: list,
    });
  } catch (e) {
    console.error("distributions-for-activity error:", e);
    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500 }
    );
  }
}
