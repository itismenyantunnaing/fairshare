import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

/**
 * GET /api/shelters/[id]/distributions-for-activity
 * List distributions this shelter is in, has not yet posted for, and is still within the 7-day posting window.
 * startDate = distribution creation time. Deadline = startDate + 7 days.
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
        { success: false, error: "ဂေဟာ ID ပုံစံ မမှန်ကန်ပါ" },
        { status: 400 }
      );
    }

    const shelterId = new ObjectId(id);
    const client = await clientPromise;
    const db = client.db("FairShare");

    const shelter = await db.collection("hostels").findOne({ _id: shelterId });
    if (!shelter) {
      return NextResponse.json(
        { success: false, error: "ဂေဟာ မတွေ့ပါ" },
        { status: 404 }
      );
    }

    const now = new Date();
    // Posting deadline = 1 week after distribution start date (not donation duration)
    const POSTING_DEADLINE_DAYS = 7;
    const deadlineWindowMs = POSTING_DEADLINE_DAYS * 24 * 60 * 60 * 1000;

    // Match allocations by ObjectId or string (some docs may have string shelterId)
    const distributions = await db
      .collection("distributions")
      .find({
        $and: [
          { $or: [{ "allocations.shelterId": shelterId }, { "allocations.shelterId": id }] },
          { $or: [{ status: { $exists: false } }, { status: "confirmed" }] },
        ],
      })
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

    // Only show distributions not yet posted for AND within 7-day posting window
    const available = distributions.filter((d) => {
      if (postedDistributionIds.has(d._id.toString())) return false;
      const start = new Date(d.startDate);
      const deadlineEnd = new Date(start.getTime() + deadlineWindowMs);
      return now >= start && now <= deadlineEnd;
    });

    const list = available.map((d) => {
      const start = new Date(d.startDate);
      const deadlineEnd = new Date(start.getTime() + deadlineWindowMs);
      return {
        id: d._id.toString(),
        name: d.name || `ဖြန့်ဝေမှု (${d.scheduleType || "custom"})`,
        startDate: d.startDate,
        endDate: d.endDate,
        deadlineDate: deadlineEnd.toISOString(),
        withinDeadline: true,
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
