import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { sendApprovalEmail, sendRejectionEmail } from "@/lib/mailer";

/**
 * GET /api/hostels/[id]
 * Fetch a single hostel by its MongoDB _id.
 * Returns full hostel data including the license image.
 */
export async function GET(req, { params }) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid hostel ID format" },
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
        { success: false, error: "Hostel not found" },
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
 * Admin action to approve or reject a hostel registration.
 *
 * Body: { action: "approve" | "reject", note?: string }
 */
export async function PATCH(req, { params }) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid hostel ID format" },
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
          error: "Invalid action. Use 'approve' or 'reject'.",
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
        { success: false, error: "Hostel not found" },
        { status: 404 }
      );
    }

    // Send email notification to the hostel owner
    let emailSent = false;
    if (hostel.email) {
      try {
        if (action === "approve") {
          await sendApprovalEmail(hostel.email, hostel.hostelName, note);
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
          "verification.reviewNote": note || null,
          updatedAt: new Date(),
        },
      }
    );

    const message =
      action === "approve"
        ? `Hostel approved successfully.${emailSent ? " Approval email sent." : ""}`
        : `Hostel rejected.${emailSent ? " Rejection email sent." : ""}`;

    return NextResponse.json({
      success: true,
      message,
      status: newStatus,
      emailSent,
    });
  } catch (e) {
    console.error("Error updating hostel:", e);
    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/hostels/[id]
 * Permanently delete a hostel record from the database.
 */
export async function DELETE(req, { params }) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid hostel ID format" },
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
        { success: false, error: "Hostel not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Hostel deleted permanently.",
    });
  } catch (e) {
    console.error("Error deleting hostel:", e);
    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500 }
    );
  }
}
