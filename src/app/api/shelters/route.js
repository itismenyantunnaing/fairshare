import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

/**
 * GET /api/shelters
 * Returns all approved shelters with limited info - requires authentication
 */
export async function GET() {
  try {
    // Verify user is logged in
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "ဝင်ရောက်ခွင့် မရှိပါ။ ကျေးဇူးပြု၍ အကောင့်ဝင်ပါ။" },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const db = client.db("FairShare");

    // Only return approved shelters with public-safe fields
    const shelters = await db
      .collection("hostels")
      .find({ "verification.status": "approved" })
      .project({
        hostelName: 1,
        city: 1,
        address: 1,
        phone: 1,
        profileImages: 1,
        population: 1,
        createdAt: 1,
      })
      .sort({ createdAt: -1 })
      .toArray();

    // Get activity counts for each shelter (for reliability score)
    const shelterIds = shelters.map((s) => s._id);
    const activityCounts = await db
      .collection("activities")
      .aggregate([
        { $match: { shelterId: { $in: shelterIds } } },
        { $group: { _id: "$shelterId", count: { $sum: 1 } } },
      ])
      .toArray();

    // Create a map of shelter ID to activity count
    const activityCountMap = {};
    activityCounts.forEach((item) => {
      activityCountMap[item._id.toString()] = item.count;
    });

    // Add reliability score to each shelter
    const sheltersWithScore = shelters.map((shelter) => ({
      ...shelter,
      reliabilityScore: {
        given: activityCountMap[shelter._id.toString()] || 0,
        total: activityCountMap[shelter._id.toString()] || 0,
      },
    }));

    return NextResponse.json({ success: true, shelters: sheltersWithScore });
  } catch (e) {
    console.error("Error fetching shelters:", e);
    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500 }
    );
  }
}
