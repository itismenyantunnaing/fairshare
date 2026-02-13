import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

/**
 * GET /api/hostels/[id]/profile
 * Fetch shelter profile data.
 * - Shelter owner can access their own profile
 * - Admins can view any shelter profile (read-only)
 */
export async function GET(req, { params }) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "ခိုလှုံရာအိမ် ID ပုံစံ မမှန်ကန်ပါ" },
        { status: 400 }
      );
    }

    // Verify JWT — must be shelter owner OR admin
    const session = await getSession();
    const isAdmin = session?.role === "admin" || session?.role === "super_admin";
    const isOwner = session?.role === "shelter" && session?.id === id;

    if (!session || (!isAdmin && !isOwner)) {
      return NextResponse.json(
        { success: false, error: "ဝင်ရောက်ခွင့် မရှိပါ။ ကျေးဇူးပြု၍ အကောင့်ဝင်ပါ။" },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const db = client.db("FairShare");

    const hostel = await db.collection("hostels").findOne({
      _id: new ObjectId(id),
    });

    if (!hostel) {
      return NextResponse.json(
        { success: false, error: "ခိုလှုံရာအိမ် မတွေ့ပါ" },
        { status: 404 }
      );
    }

    // For shelter owners: Only pending (AI passed) and approved shelters can access profile
    // Admins can view any shelter's profile
    const status = hostel.verification?.status;
    if (!isAdmin && status !== "pending" && status !== "approved") {
      return NextResponse.json(
        { success: false, error: "ပရိုဖိုင် ဝင်ရောက်ခွင့် မရှိပါ" },
        { status: 403 }
      );
    }

    // Return profile data (exclude licenseImage for performance)
    const profile = {
      _id: hostel._id,
      hostelName: hostel.hostelName,
      email: hostel.email,
      address: hostel.address,
      city: hostel.city,
      phone: hostel.phone,
      population: hostel.population || { adults: 0, children: 0 },
      profileImages: hostel.profileImages || [],
      verification: {
        status: hostel.verification?.status,
        autoCheckPassed: hostel.verification?.autoCheckPassed,
      },
      createdAt: hostel.createdAt,
      updatedAt: hostel.updatedAt,
    };

    return NextResponse.json({ success: true, profile });
  } catch (e) {
    console.error("Error fetching profile:", e);
    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/hostels/[id]/profile
 * Update shelter profile. Accessible for pending (AI passed) and approved shelters.
 *
 * Body: {
 *   hostelName, email, address, city, phone,
 *   population: { adults: number, children: number },
 *   profileImages: string[] (Supabase URLs, max 5)
 * }
 */
export async function PUT(req, { params }) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "ခိုလှုံရာအိမ် ID ပုံစံ မမှန်ကန်ပါ" },
        { status: 400 }
      );
    }

    // Verify JWT — must be the shelter owner
    const session = await getSession();
    if (!session || session.role !== "shelter" || session.id !== id) {
      return NextResponse.json(
        { success: false, error: "ဝင်ရောက်ခွင့် မရှိပါ။ ကျေးဇူးပြု၍ အကောင့်ဝင်ပါ။" },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const db = client.db("FairShare");

    // Check if shelter exists and has access
    const hostel = await db.collection("hostels").findOne({
      _id: new ObjectId(id),
    });

    if (!hostel) {
      return NextResponse.json(
        { success: false, error: "ခိုလှုံရာအိမ် မတွေ့ပါ" },
        { status: 404 }
      );
    }

    const status = hostel.verification?.status;
    if (status !== "pending" && status !== "approved") {
      return NextResponse.json(
        { success: false, error: "ပရိုဖိုင် ပြင်ဆင်ခွင့် မရှိပါ" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { hostelName, email, address, city, phone, population, profileImages } = body;

    // Validate required fields
    if (!hostelName || !email || !address || !city || !phone) {
      return NextResponse.json(
        { success: false, error: "အကွက်အားလုံး ဖြည့်သွင်းရန် လိုအပ်ပါသည်။" },
        { status: 400 }
      );
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "ကျေးဇူးပြု၍ မှန်ကန်သော အီးမေးလ်လိပ်စာ ထည့်သွင်းပါ။" },
        { status: 400 }
      );
    }

    // Validate population
    const populationData = {
      adults: Math.max(0, parseInt(population?.adults) || 0),
      children: Math.max(0, parseInt(population?.children) || 0),
    };

    // Validate profile images (max 5, must be URL strings)
    let images = hostel.profileImages || [];
    if (profileImages !== undefined) {
      if (!Array.isArray(profileImages)) {
        return NextResponse.json(
          { success: false, error: "ပရိုဖိုင်ပုံများ ပုံစံ မမှန်ကန်ပါ" },
          { status: 400 }
        );
      }
      if (profileImages.length > 5) {
        return NextResponse.json(
          { success: false, error: "ပရိုဖိုင်ပုံ အများဆုံး ၅ ပုံသာ တင်နိုင်ပါသည်။" },
          { status: 400 }
        );
      }
      images = profileImages;
    }

    // Update the shelter profile
    await db.collection("hostels").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          hostelName,
          email,
          address,
          city,
          phone,
          population: populationData,
          profileImages: images,
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: "ပရိုဖိုင် အောင်မြင်စွာ သိမ်းဆည်းပြီးပါပြီ။",
    });
  } catch (e) {
    console.error("Error updating profile:", e);
    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500 }
    );
  }
}
