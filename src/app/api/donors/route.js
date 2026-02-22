import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

/**
 * GET /api/donors
 * Returns all donors with public-safe fields. Requires any authenticated user (donor, shelter, admin).
 * When the current user is a donor, they are excluded from the list (don't see their own card).
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "ဝင်ရောက်ခွင့် မရှိပါ။ ကျေးဇူးပြု၍ အကောင့်ဝင်ပါ။" },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const db = client.db("FairShare");

    const filter = {};
    if (session.role === "donor" && session.id && ObjectId.isValid(session.id)) {
      filter._id = { $ne: new ObjectId(session.id) };
    }

    const donors = await db
      .collection("donors")
      .find(filter)
      .project({
        name: 1,
        profileImage: 1,
        createdAt: 1,
        certificates: 1,
      })
      .sort({ createdAt: -1 })
      .toArray();

    const list = donors.map((d) => ({
      _id: d._id,
      name: d.name,
      profileImage: d.profileImage || null,
      createdAt: d.createdAt,
      certificateCount: Array.isArray(d.certificates) ? d.certificates.length : 0,
    }));

    return NextResponse.json({ success: true, donors: list });
  } catch (e) {
    console.error("Error fetching donors:", e);
    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500 }
    );
  }
}
