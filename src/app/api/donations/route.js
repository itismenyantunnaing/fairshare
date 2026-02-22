import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

const VALID_CATEGORIES = ["money", "medical", "clothing", "food"];
const VALID_PAYMENT_METHODS = ["kpay", "wave"];
const MEDICAL_TYPES = ["medical_pack", "bandages", "other"];
const CLOTHING_TYPES = ["shirt_child", "shirt_adult", "pants_child", "pants_adult", "other"];
const FOOD_RICE_OPTIONS = ["one_bag", "half_bag", "custom_pyi"];
const FOOD_TYPES = ["oil_bottle", "other"];
const RICE_PYI = { one_bag: 24, half_bag: 12 };

/**
 * POST /api/donations
 * Create a new donation. Category: money | medical | clothing.
 * Body: { donorId?, category, name, email, message? }
 * + money: amount, paymentMethod, transactionScreenshot
 * + medical: medicalItems [{ type, label?, quantity }]
 * + clothing: clothingItems [{ type, label?, quantity }]
 * + food: rice?, foodItems [{ type, label?, quantity }]
 */
export async function POST(req) {
  try {
    const body = await req.json();
    const {
      donorId,
      category,
      name,
      email,
      message,
      amount,
      paymentMethod,
      transactionScreenshot,
      medicalItems,
      clothingItems,
      rice,
      foodItems,
    } = body;

    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { success: false, error: "အလှူအမျိုးအစား မမှန်ကန်ပါ။" },
        { status: 400 }
      );
    }

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "အမည် ထည့်သွင်းပါ။" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      return NextResponse.json(
        { success: false, error: "ကျေးဇူးပြု၍ မှန်ကန်သော အီးမေးလ်လိပ်စာ ထည့်သွင်းပါ။" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("FairShare");

    const base = {
      donorId: donorId && ObjectId.isValid(donorId) ? new ObjectId(donorId) : null,
      category,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      message: message ? message.trim() : null,
      status: "pending",
      certificateUrl: null,
      approvedBy: null,
      approvedAt: null,
      createdAt: new Date(),
    };

    if (category === "money") {
      const numAmount = Number(amount);
      if (!Number.isFinite(numAmount) || numAmount <= 0) {
        return NextResponse.json(
          { success: false, error: "ပမာဏ ထည့်သွင်းပါ။" },
          { status: 400 }
        );
      }
      if (!VALID_PAYMENT_METHODS.includes(paymentMethod)) {
        return NextResponse.json(
          { success: false, error: "ငွေပေးချေနည်း မမှန်ကန်ပါ။" },
          { status: 400 }
        );
      }
      if (!transactionScreenshot) {
        return NextResponse.json(
          { success: false, error: "ငွေလွှဲပုံ ဓာတ်ပုံ တင်ပါ။" },
          { status: 400 }
        );
      }
      const donation = {
        ...base,
        amount: numAmount,
        currency: "MMK",
        paymentMethod,
        transactionScreenshot,
      };
      const result = await db.collection("donations").insertOne(donation);
      return NextResponse.json({
        success: true,
        message: "အလှူငွေ တင်ပြီးပါပြီ။ စီမံခန့်ခွဲသူ အတည်ပြုသည်အထိ စောင့်ပါ။",
        donationId: result.insertedId.toString(),
      });
    }

    if (category === "medical") {
      if (!Array.isArray(medicalItems) || medicalItems.length === 0) {
        return NextResponse.json(
          { success: false, error: "ဆေးဝါး ပစ္စည်း အနည်းဆုံး တစ်ခု ရွေးပါ။" },
          { status: 400 }
        );
      }
      const items = [];
      for (const item of medicalItems) {
        if (!MEDICAL_TYPES.includes(item.type)) continue;
        const qty = parseInt(item.quantity, 10);
        if (!Number.isFinite(qty) || qty < 1) continue;
        if (item.type === "other" && (!item.label || !String(item.label).trim())) continue;
        items.push({
          type: item.type,
          label: item.type === "other" ? String(item.label).trim() : undefined,
          quantity: qty,
        });
      }
      if (items.length === 0) {
        return NextResponse.json(
          { success: false, error: "ဆေးဝါး ပစ္စည်း အနည်းဆုံး တစ်ခု ပမာဏ ထည့်ပါ။" },
          { status: 400 }
        );
      }
      const donation = { ...base, medicalItems: items };
      const result = await db.collection("donations").insertOne(donation);
      return NextResponse.json({
        success: true,
        message: "ဆေးဝါး လှူဒါန်းချက် တင်ပြီးပါပြီ။ စီမံခန့်ခွဲသူ အတည်ပြုသည်အထိ စောင့်ပါ။",
        donationId: result.insertedId.toString(),
      });
    }

    if (category === "clothing") {
      if (!Array.isArray(clothingItems) || clothingItems.length === 0) {
        return NextResponse.json(
          { success: false, error: "အဝတ်အစား အနည်းဆုံး တစ်ခု ရွေးပါ။" },
          { status: 400 }
        );
      }
      const items = [];
      for (const item of clothingItems) {
        if (!CLOTHING_TYPES.includes(item.type)) continue;
        const qty = parseInt(item.quantity, 10);
        if (!Number.isFinite(qty) || qty < 1) continue;
        if (item.type === "other" && (!item.label || !String(item.label).trim())) continue;
        items.push({
          type: item.type,
          label: item.type === "other" ? String(item.label).trim() : undefined,
          quantity: qty,
        });
      }
      if (items.length === 0) {
        return NextResponse.json(
          { success: false, error: "အဝတ်အစား အနည်းဆုံး တစ်ခု ပမာဏ ထည့်ပါ။" },
          { status: 400 }
        );
      }
      const donation = { ...base, clothingItems: items };
      const result = await db.collection("donations").insertOne(donation);
      return NextResponse.json({
        success: true,
        message: "အဝတ်အစား လှူဒါန်းချက် တင်ပြီးပါပြီ။ စီမံခန့်ခွဲသူ အတည်ပြုသည်အထိ စောင့်ပါ။",
        donationId: result.insertedId.toString(),
      });
    }

    if (category === "food") {
      const hasRice = rice && FOOD_RICE_OPTIONS.includes(rice.option);
      const hasRiceCustom = hasRice && rice.option === "custom_pyi";
      if (hasRiceCustom) {
        const customPyi = Number(rice.customPyi);
        if (!Number.isFinite(customPyi) || customPyi <= 0) {
          return NextResponse.json(
            { success: false, error: "ပြည် ပမာဏ ထည့်ပါ။" },
            { status: 400 }
          );
        }
      }
      if (hasRice && (rice.option === "one_bag" || rice.option === "half_bag")) {
        const qty = parseInt(rice.quantity, 10);
        if (!Number.isFinite(qty) || qty < 1) {
          return NextResponse.json(
            { success: false, error: "ပမာဏ အနည်းဆုံး ၁ ထည့်ပါ။" },
            { status: 400 }
          );
        }
      }
      const foodItemsArr = Array.isArray(foodItems) ? foodItems : [];
      const items = [];
      for (const item of foodItemsArr) {
        if (!FOOD_TYPES.includes(item.type)) continue;
        const qty = parseInt(item.quantity, 10);
        if (!Number.isFinite(qty) || qty < 1) continue;
        if (item.type === "other" && (!item.label || !String(item.label).trim())) continue;
        items.push({
          type: item.type,
          label: item.type === "other" ? String(item.label).trim() : undefined,
          quantity: qty,
        });
      }
      if (!hasRice && items.length === 0) {
        return NextResponse.json(
          { success: false, error: "ဆန် သို့မဟုတ် အခြား အစားအစာ အနည်းဆုံး တစ်ခု ရွေးပါ။" },
          { status: 400 }
        );
      }
      let totalPyi = 0;
      let riceDoc = null;
      if (hasRice) {
        if (rice.option === "custom_pyi") {
          totalPyi = Number(rice.customPyi);
          riceDoc = { option: "custom_pyi", customPyi: totalPyi };
        } else {
          const qty = Math.max(1, parseInt(rice.quantity, 10) || 1);
          const pyiPerUnit = RICE_PYI[rice.option] ?? 0;
          totalPyi = qty * pyiPerUnit;
          riceDoc = { option: rice.option, quantity: qty };
        }
      }
      const donation = {
        ...base,
        ...(riceDoc && { rice: riceDoc }),
        foodItems: items,
        totalPyi,
      };
      const result = await db.collection("donations").insertOne(donation);
      return NextResponse.json({
        success: true,
        message: "အစားအစာ လှူဒါန်းချက် တင်ပြီးပါပြီ။ စီမံခန့်ခွဲသူ အတည်ပြုသည်အထိ စောင့်ပါ။",
        donationId: result.insertedId.toString(),
      });
    }

    return NextResponse.json(
      { success: false, error: "အလှူအမျိုးအစား မမှန်ကန်ပါ။" },
      { status: 400 }
    );
  } catch (e) {
    console.error("Donation create error:", e);
    return NextResponse.json(
      { success: false, error: e.message || "အလှူ တင်၍ မရပါ။" },
      { status: 500 }
    );
  }
}
