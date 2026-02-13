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

    return NextResponse.json({ success: true, shelters });
  } catch (e) {
    console.error("Error fetching shelters:", e);
    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500 }
    );
  }
}
