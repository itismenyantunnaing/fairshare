import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

/**
 * GET /api/distributions/[id]
 * Single distribution detail + activities (posts) for donor/shelter.
 */
export async function GET(req, { params }) {
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

    const distribution = await db.collection("distributions").findOne(
      { _id: distId },
      role === "shelter"
        ? { projection: { name: 1, startDate: 1, endDate: 1, scheduleType: 1, createdAt: 1, allocations: 1 } }
        : { projection: { name: 1, startDate: 1, endDate: 1, scheduleType: 1, createdAt: 1 } }
    );

    if (!distribution) {
      return NextResponse.json(
        { success: false, error: "ဖြန့်ဝေမှု မတွေ့ပါ။" },
        { status: 404 }
      );
    }

    const activities = await db
      .collection("activities")
      .find({ distributionId: distId })
      .sort({ createdAt: -1 })
      .toArray();

    let shelterCanAddPost = false;
    let shelterId = null;
    if (role === "shelter" && session.id) {
      const shelterObjId = session.id;
      const inAllocations = (distribution.allocations || []).some(
        (a) => a.shelterId && a.shelterId.toString() === shelterObjId
      );
      const hasPosted = activities.some(
        (a) => a.shelterId && a.shelterId.toString() === shelterObjId
      );
      if (inAllocations && !hasPosted) {
        shelterCanAddPost = true;
        shelterId = session.id;
      }
    }

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
        id: distribution._id.toString(),
        name: distribution.name || "ဖြန့်ဝေမှု",
        startDate: distribution.startDate,
        endDate: distribution.endDate,
        donationPeriodStart: distribution.donationPeriodStart || distribution.startDate,
        donationPeriodEnd: distribution.donationPeriodEnd || distribution.endDate,
        scheduleType: distribution.scheduleType,
        createdAt: distribution.createdAt,
      },
      activities: activitiesForClient,
      shelterCanAddPost,
      shelterId,
    });
  } catch (e) {
    console.error("GET distribution error:", e);
    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500 }
    );
  }
}
