import { NextResponse } from "next/server";
import { uploadImage } from "@/lib/cloudinary";

export async function POST(request) {
  try {
    const { image, folder } = await request.json();

    if (!image) {
      return NextResponse.json(
        { success: false, error: "ပုံမပါဝင်ပါ" },
        { status: 400 }
      );
    }

    // Upload to Cloudinary
    const result = await uploadImage(image, folder || "general");

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: result.url,
      publicId: result.publicId,
    });
  } catch (error) {
    console.error("Upload API error:", error);
    return NextResponse.json(
      { success: false, error: "ပုံတင်ရာတွင် အမှားဖြစ်ပွားပါသည်" },
      { status: 500 }
    );
  }
}
