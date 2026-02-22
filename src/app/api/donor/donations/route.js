import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { ObjectId } from "mongodb";

/**
 * GET /api/donor/donations
 * List donations for the current donor.
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "donor") {
      return NextResponse.json(
        { success: false, error: "ဝင်ရောက်ခွင့် မရှိပါ။" },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const db = client.db("FairShare");

    const donations = await db
      .collection("donations")
      .find({ donorId: new ObjectId(session.id) })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      donations: donations.map((d) => ({
        ...d,
        id: d._id.toString(),
      })),
    });
  } catch (e) {
    console.error("Donor donations GET error:", e);
    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500 }
    );
  }
}
