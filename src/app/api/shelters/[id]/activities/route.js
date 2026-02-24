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
        { success: false, error: "ဂေဟာ ID ပုံစံ မမှန်ကန်ပါ" },
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
        { success: false, error: "ဂေဟာ မတွေ့ပါ" },
        { status: 404 }
      );
    }

    // Get all activities for this shelter
    const activities = await db
      .collection("activities")
      .find({ shelterId: new ObjectId(id) })
      .sort({ createdAt: -1 })
      .toArray();

    // Reliability: total = all distributions this shelter is involved in, given = activities posted for those
    const shelterObjId = new ObjectId(id);
    const allDistributionsWithShelter = await db
      .collection("distributions")
      .find({ "allocations.shelterId": shelterObjId })
      .project({ _id: 1 })
      .toArray();

    const distIds = allDistributionsWithShelter.map((d) => d._id);
    const totalDistributions = distIds.length;

    const activitiesWithDist = await db
      .collection("activities")
      .find({
        shelterId: shelterObjId,
        distributionId: { $in: distIds },
      })
      .project({ distributionId: 1 })
      .toArray();

    const feedbackGiven = activitiesWithDist.length;
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
 *   images: string[] (image URLs),
 *   excelFile: string | null (optional, for backward compatibility; upload not supported)
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
        { success: false, error: "ဂေဟာ ID ပုံစံ မမှန်ကန်ပါ" },
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
        { success: false, error: "ဂေဟာ မတွေ့ပါ" },
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
    const { distributionId, distributionName, distributionDate, title, description, images, excelFile } = body;

    // Validate required fields
    if (!distributionId || !title || !description) {
      return NextResponse.json(
        { success: false, error: "ဖြန့်ဝေမှု ရွေးချယ်ခြင်း၊ ခေါင်းစဉ်နှင့် ဖော်ပြချက် ထည့်သွင်းရန် လိုအပ်ပါသည်။" },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(distributionId)) {
      return NextResponse.json(
        { success: false, error: "ဖြန့်ဝေမှု ID ပုံစံ မမှန်ကန်ပါ။" },
        { status: 400 }
      );
    }

    const distObjId = new ObjectId(distributionId);
    const distribution = await db.collection("distributions").findOne({ _id: distObjId });
    if (!distribution) {
      return NextResponse.json(
        { success: false, error: "ဖြန့်ဝေမှု မတွေ့ပါ။" },
        { status: 404 }
      );
    }

    if (distribution.status === "draft") {
      return NextResponse.json(
        { success: false, error: "ဤဖြန့်ဝေမှု မအတည်ပြုရသေးပါ။ အတည်ပြုပြီးမှ လှုပ်ရှားမှု တင်နိုင်ပါသည်။" },
        { status: 400 }
      );
    }

    const toIdStr = (x) => (x == null ? "" : typeof x.toString === "function" ? x.toString() : String(x));
    const inAllocations = (distribution.allocations || []).some(
      (a) => toIdStr(a.shelterId) === id
    );
    if (!inAllocations) {
      return NextResponse.json(
        { success: false, error: "သင့်ဂေဟာသည် ဤဖြန့်ဝေမှုတွင် ပါဝင်မထားပါ။" },
        { status: 400 }
      );
    }

    const now = new Date();
    const startDate = new Date(distribution.startDate);
    const deadlineEnd = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    if (now < startDate) {
      return NextResponse.json(
        { success: false, error: "ဤဖြန့်ဝေမှု စတင်ရက် မတိုင်သေးပါ။" },
        { status: 400 }
      );
    }
    if (now > deadlineEnd) {
      return NextResponse.json(
        { success: false, error: "ဤဖြန့်ဝေမှုအတွက် လှုပ်ရှားမှု တင်ရန် ရက်စွဲ ကျော်လွန်ပြီးဖြစ်ပါသည်။ (ဖြန့်ဝေမှုဖန်တီးပြီး ၇ ရက်အတွင်း တင်ရမည်)" },
        { status: 400 }
      );
    }

    const existingActivity = await db.collection("activities").findOne({
      shelterId: new ObjectId(id),
      distributionId: distObjId,
    });
    if (existingActivity) {
      return NextResponse.json(
        { success: false, error: "ဤဖြန့်ဝေမှုအတွက် လှုပ်ရှားမှု တင်ပြီးသားဖြစ်ပါသည်။" },
        { status: 409 }
      );
    }

    // Validate images (max 10)
    if (images && (!Array.isArray(images) || images.length > 10)) {
      return NextResponse.json(
        { success: false, error: "ဓာတ်ပုံ အများဆုံး ၁၀ ပုံသာ တင်နိုင်ပါသည်။" },
        { status: 400 }
      );
    }

    const distName = distributionName?.trim() || distribution.name || "ဖြန့်ဝေမှု";
    const distDate = distributionDate ? new Date(distributionDate) : new Date(distribution.startDate);

    const newActivity = {
      shelterId: new ObjectId(id),
      shelterName: shelter.hostelName,
      distributionId: distObjId,
      distributionName: distName,
      distributionDate: distDate,
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
