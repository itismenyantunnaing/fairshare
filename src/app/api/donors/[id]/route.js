import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

/**
 * GET /api/donors/[id]
 * Returns one donor's public profile. Requires any authenticated user.
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
        { success: false, error: "အလှူရှင် ID ပုံစံ မမှန်ကန်ပါ" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("FairShare");

    const donor = await db.collection("donors").findOne(
      { _id: new ObjectId(id) },
      {
        projection: {
          name: 1,
          profileImage: 1,
          createdAt: 1,
          certificates: 1,
        },
      }
    );

    if (!donor) {
      return NextResponse.json(
        { success: false, error: "အလှူရှင် မတွေ့ပါ" },
        { status: 404 }
      );
    }

    const certificateCount = Array.isArray(donor.certificates) ? donor.certificates.length : 0;

    return NextResponse.json({
      success: true,
      donor: {
        _id: donor._id,
        name: donor.name,
        profileImage: donor.profileImage || null,
        createdAt: donor.createdAt,
        certificateCount,
      },
    });
  } catch (e) {
    console.error("Error fetching donor:", e);
    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500 }
    );
  }
}
