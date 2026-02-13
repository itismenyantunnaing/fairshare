import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const client = await clientPromise;
    const db = client.db("FairShare");

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const query = {};
    if (status) {
      query["verification.status"] = status;
    }

    const hostels = await db
      .collection("hostels")
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    const sanitizedHostels = hostels.map((h) => ({
      ...h,
      licenseImage: h.licenseImage ? true : false,
    }));

    return NextResponse.json({ success: true, hostels: sanitizedHostels });
  } catch (e) {
    console.error("Error fetching hostels:", e);
    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500 }
    );
  }
}
