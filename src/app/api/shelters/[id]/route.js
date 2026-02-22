import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

/**
 * GET /api/shelters/[id]
 * Returns a single approved shelter's info - requires authentication
 */
export async function GET(req, { params }) {
  try {
    // Verify user is logged in
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

    // Only return if shelter is approved
    const shelter = await db.collection("hostels").findOne(
      {
        _id: new ObjectId(id),
        "verification.status": "approved",
      },
      {
        projection: {
          hostelName: 1,
          city: 1,
          address: 1,
          phone: 1,
          description: 1,
          profileImages: 1,
          population: 1,
          createdAt: 1,
        },
      }
    );

    if (!shelter) {
      return NextResponse.json(
        { success: false, error: "ခိုလှုံရာအိမ် မတွေ့ပါ သို့မဟုတ် အတည်မပြုရသေးပါ" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, shelter });
  } catch (e) {
    console.error("Error fetching shelter:", e);
    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500 }
    );
  }
}
