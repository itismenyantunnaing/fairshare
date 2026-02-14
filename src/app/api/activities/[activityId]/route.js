import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

/**
 * GET /api/activities/[activityId]
 * Get a single activity detail - requires authentication
 */
export async function GET(req, { params }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "ဝင်ရောက်ခွင့် မရှိပါ။ ကျေးဇူးပြု၍ အကောင့်ဝင်ပါ။" },
        { status: 401 }
      );
    }

    const { activityId } = await params;

    if (!ObjectId.isValid(activityId)) {
      return NextResponse.json(
        { success: false, error: "လှုပ်ရှားမှု ID ပုံစံ မမှန်ကန်ပါ" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("FairShare");

    const activity = await db.collection("activities").findOne({
      _id: new ObjectId(activityId),
    });

    if (!activity) {
      return NextResponse.json(
        { success: false, error: "လှုပ်ရှားမှု မတွေ့ပါ" },
        { status: 404 }
      );
    }

    // Get shelter info
    const shelter = await db.collection("hostels").findOne(
      { _id: activity.shelterId },
      { projection: { hostelName: 1, city: 1, profileImages: 1 } }
    );

    return NextResponse.json({
      success: true,
      activity: {
        ...activity,
        shelter: shelter || null,
      },
    });
  } catch (e) {
    console.error("Error fetching activity:", e);
    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/activities/[activityId]
 * Delete an activity - only shelter owner or admin can delete
 */
export async function DELETE(req, { params }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "ဝင်ရောက်ခွင့် မရှိပါ။" },
        { status: 401 }
      );
    }

    const { activityId } = await params;

    if (!ObjectId.isValid(activityId)) {
      return NextResponse.json(
        { success: false, error: "လှုပ်ရှားမှု ID ပုံစံ မမှန်ကန်ပါ" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("FairShare");

    const activity = await db.collection("activities").findOne({
      _id: new ObjectId(activityId),
    });

    if (!activity) {
      return NextResponse.json(
        { success: false, error: "လှုပ်ရှားမှု မတွေ့ပါ" },
        { status: 404 }
      );
    }

    // Check authorization: owner or admin
    const isAdmin = session.role === "admin" || session.role === "super_admin";
    const isOwner = session.role === "shelter" && session.id === activity.shelterId.toString();

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { success: false, error: "ဖျက်ခွင့် မရှိပါ" },
        { status: 403 }
      );
    }

    await db.collection("activities").deleteOne({ _id: new ObjectId(activityId) });

    return NextResponse.json({
      success: true,
      message: "လှုပ်ရှားမှု ဖျက်ပြီးပါပြီ။",
    });
  } catch (e) {
    console.error("Error deleting activity:", e);
    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500 }
    );
  }
}
