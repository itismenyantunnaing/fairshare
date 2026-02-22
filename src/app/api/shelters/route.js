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

    // Reliability: total = all distributions shelter is involved in, given = activities posted for those
    const shelterIds = shelters.map((s) => s._id);

    const allDistributions = await db
      .collection("distributions")
      .find({})
      .project({ _id: 1, allocations: 1 })
      .toArray();

    const totalByShelter = {};
    const distIdsByShelter = {};
    shelterIds.forEach((sid) => {
      const sidStr = sid.toString();
      totalByShelter[sidStr] = 0;
      distIdsByShelter[sidStr] = [];
    });
    allDistributions.forEach((d) => {
      const distId = d._id;
      (d.allocations || []).forEach((a) => {
        const aid = a.shelterId != null && typeof a.shelterId.toString === "function" ? a.shelterId.toString() : (a.shelterId != null ? String(a.shelterId) : null);
        if (aid && distIdsByShelter[aid] !== undefined) {
          distIdsByShelter[aid].push(distId);
          totalByShelter[aid]++;
        }
      });
    });

    const activitiesWithDist = await db
      .collection("activities")
      .find({
        shelterId: { $in: shelterIds },
        distributionId: { $exists: true, $ne: null },
      })
      .project({ shelterId: 1, distributionId: 1 })
      .toArray();

    const givenByShelter = {};
    shelterIds.forEach((sid) => {
      givenByShelter[sid.toString()] = 0;
    });
    activitiesWithDist.forEach((act) => {
      const sidStr = act.shelterId?.toString?.();
      const distSet = distIdsByShelter[sidStr];
      if (distSet && distSet.some((did) => did.equals(act.distributionId))) {
        givenByShelter[sidStr]++;
      }
    });

    const sheltersWithScore = shelters.map((shelter) => {
      const sidStr = shelter._id && typeof shelter._id.toString === "function" ? shelter._id.toString() : String(shelter._id);
      return {
        ...shelter,
        reliabilityScore: {
          given: Number(givenByShelter[sidStr]) || 0,
          total: Number(totalByShelter[sidStr]) || 0,
        },
      };
    });

    return NextResponse.json({ success: true, shelters: sheltersWithScore });
  } catch (e) {
    console.error("Error fetching shelters:", e);
    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500 }
    );
  }
}
