import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ success: false, user: null });
    }

    // Build response based on role
    const user = {
      id: session.id,
      email: session.email,
      role: session.role,
    };

    // Add role-specific fields
    if (session.role === "shelter") {
      user.hostelName = session.hostelName;
      user.status = session.status;

      // Fetch profile image from database
      try {
        const client = await clientPromise;
        const db = client.db("FairShare");
        const shelter = await db.collection("hostels").findOne(
          { _id: new ObjectId(session.id) },
          { projection: { profileImages: 1, "verification.status": 1 } }
        );
        if (shelter) {
          user.profileImage = shelter.profileImages?.[0] || null;
          user.status = shelter.verification?.status || session.status;
        }
      } catch {
        // Ignore DB errors, continue without profile image
      }
    } else if (session.role === "donor") {
      user.name = session.name;
      try {
        const client = await clientPromise;
        const db = client.db("FairShare");
        const donor = await db.collection("donors").findOne(
          { _id: new ObjectId(session.id) },
          { projection: { profileImage: 1, name: 1 } }
        );
        if (donor) {
          user.profileImage = donor.profileImage || null;
          user.name = donor.name || session.name;
        }
      } catch {
        // Ignore DB errors
      }
    } else {
      // admin or super_admin
      user.name = session.name;
      user.canManageDistribution = session.role === "super_admin";
      if (session.role === "admin") {
        try {
          const client = await clientPromise;
          const db = client.db("FairShare");
          const admin = await db.collection("admins").findOne(
            { _id: new ObjectId(session.id) },
            { projection: { canManageDistribution: 1 } }
          );
          user.canManageDistribution = !!admin?.canManageDistribution;
        } catch {
          user.canManageDistribution = false;
        }
      }
    }

    return NextResponse.json({ success: true, user });
  } catch (e) {
    console.error("Session check error:", e);
    return NextResponse.json({ success: false, user: null });
  }
}
