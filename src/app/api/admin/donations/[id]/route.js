import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { ObjectId } from "mongodb";
import { sendDonationApprovedEmail, sendDonationRejectedEmail } from "@/lib/mailer";

/**
 * PATCH /api/admin/donations/[id]
 * Approve or reject a donation. Body: { action: "approve"|"reject", certificateUrl (required for approve), note? }
 * Sends email on approve and reject.
 */
export async function PATCH(req, { params }) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "super_admin")) {
      return NextResponse.json(
        { success: false, error: "ဝင်ရောက်ခွင့် မရှိပါ။" },
        { status: 401 }
      );
    }

    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "ID ပုံစံ မမှန်ကန်ပါ" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("FairShare");
    const donation = await db.collection("donations").findOne({ _id: new ObjectId(id) });

    if (!donation) {
      return NextResponse.json(
        { success: false, error: "အလှူငွေ မတွေ့ပါ" },
        { status: 404 }
      );
    }

    if (donation.status !== "pending") {
      return NextResponse.json(
        { success: false, error: "ဤအလှူငွေကို ပြန်လည် အတည်ပြု/ငြင်းပယ်၍ မရပါ။" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { action, certificateUrl, note } = body;

    const emailTo = donation.email;
    const donorName = donation.name;

    const RICE_LABEL = { one_bag: "တအိတ် (၂၄ ပြည်)", half_bag: "တအိတ် ခွဲ (၁၂ ပြည်)", custom_pyi: "စိတ်ကြိုက် ပြည်" };
    const ITEM_LABEL = {
      medical_pack: "ဆေးသေတ္တာ", bandages: "ပတ်တီး",
      shirt_child: "ကလေး အင်္ကျီ", shirt_adult: "လူကြီး အင်္ကျီ",
      pants_child: "ကလေး ဘောင်းဘီ", pants_adult: "လူကြီး ဘောင်းဘီ",
      oil_bottle: "ဆီပုလင်း", other: "အခြား",
    };

    let summary;
    const cat = donation.category || "money";
    if (cat === "money") {
      summary = `${Number(donation.amount).toLocaleString()} MMK`;
    } else if (cat === "food") {
      const parts = [];
      if (donation.rice?.option) {
        if (donation.rice.option === "custom_pyi" && donation.rice.customPyi != null) parts.push(`${donation.rice.customPyi} ပြည်`);
        else parts.push(RICE_LABEL[donation.rice.option] || donation.rice.option);
      }
      if (donation.foodItems?.length) parts.push(...donation.foodItems.map(i => `${i.label || ITEM_LABEL[i.type] || i.type} ×${i.quantity}`));
      summary = parts.length ? parts.join(", ") : "အစားအစာ";
    } else {
      const items = cat === "medical" ? donation.medicalItems : donation.clothingItems;
      summary = (items || []).map(i => `${i.label || ITEM_LABEL[i.type] || i.type} ×${i.quantity}`).join(", ") || (cat === "medical" ? "ဆေးဝါး" : "အဝတ်အစား");
    }

    if (action === "approve") {
      const certUrl = typeof certificateUrl === "string" ? certificateUrl.trim() : "";
      if (!certUrl) {
        return NextResponse.json(
          { success: false, error: "အတည်ပြုရန် လက်မှတ် ဓာတ်ပုံ ထည့်သွင်းရပါမည်။" },
          { status: 400 }
        );
      }
      await db.collection("donations").updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            status: "approved",
            certificateUrl: certUrl,
            approvedBy: session.id,
            approvedAt: new Date(),
          },
        }
      );

      if (donation.donorId && certUrl) {
        const certEntry = {
          donationId: id,
          url: certUrl,
          approvedAt: new Date(),
        };
        await db.collection("donors").updateOne(
          { _id: donation.donorId },
          { $push: { certificates: certEntry }, $set: { updatedAt: new Date() } }
        );
      }

      try {
        await sendDonationApprovedEmail(emailTo, donorName, summary, certUrl);
      } catch (mailErr) {
        console.error("Donation approval email error:", mailErr);
      }

      return NextResponse.json({
        success: true,
        message: "အလှူကို အတည်ပြုပြီး ဖြစ်ပါပြီ။ အီးမေးလ် ပို့ပြီးပါပြီ။",
      });
    }

    if (action === "reject") {
      await db.collection("donations").updateOne(
        { _id: new ObjectId(id) },
        { $set: { status: "rejected" } }
      );

      try {
        await sendDonationRejectedEmail(emailTo, donorName, summary, note || null);
      } catch (mailErr) {
        console.error("Donation rejection email error:", mailErr);
      }

      return NextResponse.json({
        success: true,
        message: "အလှူကို ငြင်းပယ်ပြီး ဖြစ်ပါပြီ။ အီးမေးလ် ပို့ပြီးပါပြီ။",
      });
    }

    return NextResponse.json(
      { success: false, error: "action မှားယွင်းပါသည်။ approve သို့မဟုတ် reject ဖြစ်ရမည်။" },
      { status: 400 }
    );
  } catch (e) {
    console.error("Admin donation PATCH error:", e);
    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/donations/[id]
 * Delete a donation. Only rejected donations can be deleted.
 */
export async function DELETE(req, { params }) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "super_admin")) {
      return NextResponse.json(
        { success: false, error: "ဝင်ရောက်ခွင့် မရှိပါ။" },
        { status: 401 }
      );
    }

    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "ID ပုံစံ မမှန်ကန်ပါ" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("FairShare");
    const donation = await db.collection("donations").findOne({ _id: new ObjectId(id) });

    if (!donation) {
      return NextResponse.json(
        { success: false, error: "အလှူငွေ မတွေ့ပါ" },
        { status: 404 }
      );
    }

    if (donation.status !== "rejected") {
      return NextResponse.json(
        { success: false, error: "ငြင်းပယ်ပြီး အလှူငွေကိုသာ ဖျက်မှု ခွင့်ပြုပါသည်။" },
        { status: 400 }
      );
    }

    await db.collection("donations").deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({
      success: true,
      message: "အလှူငွေ ဖျက်ပြီးပါပြီ။",
    });
  } catch (e) {
    console.error("Admin donation DELETE error:", e);
    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500 }
    );
  }
}
