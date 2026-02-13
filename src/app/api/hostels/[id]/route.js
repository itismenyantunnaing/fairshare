import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { sendApprovalEmail, sendRejectionEmail } from "@/lib/mailer";
import { getSession } from "@/lib/auth";

/**
 * GET /api/hostels/[id]
 * Fetch a single shelter by its MongoDB _id.
 * Returns full shelter data including the license image.
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

    return NextResponse.json({ success: true, hostel });
  } catch (e) {
    console.error("Error fetching hostel:", e);
    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/hostels/[id]
 * Admin action to approve or reject a shelter registration.
 *
 * Body: { action: "approve" | "reject", note?: string }
 */
export async function PATCH(req, { params }) {
  try {
    // Verify admin is logged in
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "super_admin")) {
      return NextResponse.json(
        { success: false, error: "ဝင်ရောက်ခွင့် မရှိပါ။ စီမံခန့်ခွဲသူ အကောင့်ဖြင့် ဝင်ရောက်ပါ။" },
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
    const body = await req.json();

    const { action, note } = body;

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json(
        {
          success: false,
          error: "လုပ်ဆောင်ချက် မမှန်ကန်ပါ။ 'approve' သို့မဟုတ် 'reject' ကို အသုံးပြုပါ။",
        },
        { status: 400 }
      );
    }

    // Fetch the hostel first (need email for notification before potential deletion)
    const hostel = await db.collection("hostels").findOne({
      _id: new ObjectId(id),
    });

    if (!hostel) {
      return NextResponse.json(
        { success: false, error: "ခိုလှုံရာအိမ် မတွေ့ပါ" },
        { status: 404 }
      );
    }

    // Send email notification to the shelter owner
    let emailSent = false;
    if (hostel.email) {
      try {
        if (action === "approve") {
          await sendApprovalEmail(hostel.email, hostel.hostelName, note, id);
        } else {
          await sendRejectionEmail(hostel.email, hostel.hostelName, note);
        }
        emailSent = true;
      } catch (emailError) {
        console.error("Failed to send email notification:", emailError.message);
      }
    }

    const newStatus = action === "approve" ? "approved" : "rejected";

    await db.collection("hostels").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          "verification.status": newStatus,
          "verification.reviewedAt": new Date(),
          "verification.reviewedBy": {
            id: session.id,
            name: session.name,
            role: session.role,
          },
          "verification.reviewNote": note || null,
          updatedAt: new Date(),
        },
      }
    );

    const message =
      action === "approve"
        ? `ခိုလှုံရာအိမ် အတည်ပြုပြီးပါပြီ။${emailSent ? " အတည်ပြုချက် အီးမေးလ် ပေးပို့ပြီးပါပြီ။" : ""}`
        : `ခိုလှုံရာအိမ် ငြင်းပယ်ပြီးပါပြီ။${emailSent ? " ငြင်းပယ်ချက် အီးမေးလ် ပေးပို့ပြီးပါပြီ။" : ""}`;

    return NextResponse.json({
      success: true,
      message,
      status: newStatus,
      emailSent,
    });
  } catch (e) {
    console.error("Error updating shelter:", e);
    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/hostels/[id]
 * Permanently delete a shelter record from the database.
 */
export async function DELETE(req, { params }) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "ခိုလှုံရာအိမ် ID ပုံစံ မမှန်ကန်ပါ" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("FairShare");

    const result = await db.collection("hostels").deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: "ခိုလှုံရာအိမ် မတွေ့ပါ" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "ခိုလှုံရာအိမ်ကို အပြီးတိုင် ဖျက်ပစ်ပြီးပါပြီ။",
    });
  } catch (e) {
    console.error("Error deleting shelter:", e);
    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500 }
    );
  }
}
