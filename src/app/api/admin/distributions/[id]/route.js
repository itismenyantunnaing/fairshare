import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { canManageDistribution } from "@/lib/distributionAuth";

/**
 * GET /api/admin/distributions/[id]
 * Single distribution detail. Requires canManageDistribution.
 */
export async function GET(req, { params }) {
  try {
    const session = await getSession();
    const canManage = await canManageDistribution(session);
    if (!canManage) {
      return NextResponse.json(
        { success: false, error: "ဝင်ရောက်ခွင့် မရှိပါ။" },
        { status: 403 }
      );
    }

    const { id } = await params;
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "ID ပုံစံ မမှန်ကန်ပါ။" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("FairShare");

    const distribution = await db.collection("distributions").findOne({
      _id: new ObjectId(id),
    });

    if (!distribution) {
      return NextResponse.json(
        { success: false, error: "ဖြန့်ဝေမှု မတွေ့ပါ။" },
        { status: 404 }
      );
    }

    const distId = new ObjectId(id);
    const activitiesForDist = await db
      .collection("activities")
      .find({ distributionId: distId })
      .project({ shelterId: 1, createdAt: 1 })
      .toArray();

    const toIdStr = (x) => (x == null ? "" : typeof x.toString === "function" ? x.toString() : String(x));

    const startDate = distribution.startDate ? new Date(distribution.startDate) : null;
    // Posting deadline = 1 week after distribution start date (not donation duration)
    const deadlineEnd = startDate ? new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000) : null;

    const activityByShelter = {};
    activitiesForDist.forEach((act) => {
      const sid = toIdStr(act.shelterId);
      if (!sid) return;
      const withinDeadline = startDate && deadlineEnd && act.createdAt
        ? new Date(act.createdAt) >= startDate && new Date(act.createdAt) <= deadlineEnd
        : false;
      activityByShelter[sid] = { posted: true, withinDeadline };
    });

    const allocationsWithActivity = (distribution.allocations || []).map((a) => {
      const sidStr = toIdStr(a.shelterId);
      const status = activityByShelter[sidStr] || { posted: false, withinDeadline: false };
      return {
        ...a,
        shelterId: a.shelterId,
        activityPosted: status.posted,
        activityWithinDeadline: status.withinDeadline,
      };
    });

    const now = new Date();
    const deadlinePassed = startDate && deadlineEnd ? now > deadlineEnd : false;

    const activities = await db
      .collection("activities")
      .find({ distributionId: distId })
      .sort({ createdAt: -1 })
      .toArray();

    const activitiesForClient = activities.map((a) => ({
      id: a._id.toString(),
      shelterName: a.shelterName,
      shelterId: a.shelterId?.toString(),
      distributionName: a.distributionName,
      distributionDate: a.distributionDate,
      title: a.title,
      description: a.description,
      images: a.images || [],
      excelFile: a.excelFile || null,
      createdAt: a.createdAt,
    }));

    return NextResponse.json({
      success: true,
      distribution: {
        ...distribution,
        id: distribution._id.toString(),
        createdBy: distribution.createdBy?.toString(),
        allocations: allocationsWithActivity,
        deadlinePassed,
        deadlineDate: deadlineEnd ? deadlineEnd.toISOString() : null,
        activities: activitiesForClient,
      },
    });
  } catch (e) {
    console.error("GET distribution error:", e);
    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/distributions/[id]
 * Cancel/delete distribution: restore donations to pool (unset distributionId) then delete distribution. Requires canManageDistribution.
 */
export async function DELETE(req, { params }) {
  try {
    const session = await getSession();
    const canManage = await canManageDistribution(session);
    if (!canManage) {
      return NextResponse.json(
        { success: false, error: "ဝင်ရောက်ခွင့် မရှိပါ။" },
        { status: 403 }
      );
    }

    const { id } = await params;
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "ID ပုံစံ မမှန်ကန်ပါ။" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("FairShare");
    const distId = new ObjectId(id);

    const distribution = await db.collection("distributions").findOne({ _id: distId });

    if (!distribution) {
      return NextResponse.json(
        { success: false, error: "ဖြန့်ဝေမှု မတွေ့ပါ။" },
        { status: 404 }
      );
    }

    const donationIds = distribution.donationIds || [];
    if (donationIds.length > 0) {
      const ids = donationIds.map((oid) => (oid && ObjectId.isValid(oid) ? new ObjectId(oid) : null)).filter(Boolean);
      if (ids.length > 0) {
        await db.collection("donations").updateMany(
          { _id: { $in: ids } },
          { $unset: { distributionId: "" } }
        );
      }
    }

    await db.collection("distributions").deleteOne({ _id: distId });

    return NextResponse.json({
      success: true,
      message: "ဖြန့်ဝေမှု ဖျက်ပြီးပါပြီ။ အလှူများ ပြန်လည် သုံးစွဲနိုင်ပါပြီ။",
    });
  } catch (e) {
    console.error("DELETE distribution error:", e);
    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500 }
    );
  }
}
