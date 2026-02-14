import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

/**
 * GET /api/shelters/[id]/activities
 * Get all activities for a shelter - requires authentication
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

    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "ခိုလှုံရာအိမ် ID ပုံစံ မမှန်ကန်ပါ" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("FairShare");

    // Verify shelter exists
    const shelter = await db.collection("hostels").findOne({
      _id: new ObjectId(id),
    });

    if (!shelter) {
      return NextResponse.json(
        { success: false, error: "ခိုလှုံရာအိမ် မတွေ့ပါ" },
        { status: 404 }
      );
    }

    // Get all activities for this shelter
    const activities = await db
      .collection("activities")
      .find({ shelterId: new ObjectId(id) })
      .sort({ createdAt: -1 })
      .toArray();

    // Calculate reliability score
    const totalDistributions = activities.length; // For now, each activity = 1 distribution feedback
    const feedbackGiven = activities.length;
    const reliabilityScore = {
      given: feedbackGiven,
      total: totalDistributions,
      percentage: totalDistributions > 0 ? Math.round((feedbackGiven / totalDistributions) * 100) : 0,
    };

    return NextResponse.json({
      success: true,
      activities,
      reliabilityScore,
    });
  } catch (e) {
    console.error("Error fetching activities:", e);
    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/shelters/[id]/activities
 * Create new activity - only shelter owner can create
 * 
 * Body: {
 *   distributionName: string,
 *   distributionDate: string (ISO date),
 *   title: string,
 *   description: string,
 *   images: string[] (Supabase URLs),
 *   excelFile: string | null (Supabase URL)
 * }
 */
export async function POST(req, { params }) {
  try {
    const session = await getSession();
    const { id } = await params;

    // Only shelter owner can create activities
    if (!session || session.role !== "shelter" || session.id !== id) {
      return NextResponse.json(
        { success: false, error: "ဝင်ရောက်ခွင့် မရှိပါ။" },
        { status: 401 }
      );
    }

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "ခိုလှုံရာအိမ် ID ပုံစံ မမှန်ကန်ပါ" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("FairShare");

    // Verify shelter exists and is approved or pending
    const shelter = await db.collection("hostels").findOne({
      _id: new ObjectId(id),
    });

    if (!shelter) {
      return NextResponse.json(
        { success: false, error: "ခိုလှုံရာအိမ် မတွေ့ပါ" },
        { status: 404 }
      );
    }

    const status = shelter.verification?.status;
    if (status !== "pending" && status !== "approved") {
      return NextResponse.json(
        { success: false, error: "လှုပ်ရှားမှု တင်ခွင့် မရှိပါ" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { distributionName, distributionDate, title, description, images, excelFile } = body;

    // Validate required fields
    if (!distributionName || !title || !description) {
      return NextResponse.json(
        { success: false, error: "ဖြန့်ဝေမှုအမည်၊ ခေါင်းစဉ်နှင့် ဖော်ပြချက် ထည့်သွင်းရန် လိုအပ်ပါသည်။" },
        { status: 400 }
      );
    }

    // Validate images (max 10)
    if (images && (!Array.isArray(images) || images.length > 10)) {
      return NextResponse.json(
        { success: false, error: "ဓာတ်ပုံ အများဆုံး ၁၀ ပုံသာ တင်နိုင်ပါသည်။" },
        { status: 400 }
      );
    }

    // Create new activity
    const newActivity = {
      shelterId: new ObjectId(id),
      shelterName: shelter.hostelName,
      distributionId: null, // For future distribution linking
      distributionName: distributionName.trim(),
      distributionDate: distributionDate ? new Date(distributionDate) : null,
      title: title.trim(),
      description: description.trim(),
      images: images || [],
      excelFile: excelFile || null,
      createdAt: new Date(),
    };

    const result = await db.collection("activities").insertOne(newActivity);

    return NextResponse.json({
      success: true,
      message: "လှုပ်ရှားမှု အောင်မြင်စွာ တင်ပြီးပါပြီ။",
      activityId: result.insertedId,
    });
  } catch (e) {
    console.error("Error creating activity:", e);
    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500 }
    );
  }
}
