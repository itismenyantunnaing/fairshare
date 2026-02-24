import clientPromise from "@/lib/mongodb";
import { getSession } from "@/lib/auth";
import { ObjectId } from "mongodb";

/**
 * GET /api/donor/download-certificate?donationId=xxx
 * Download certificate image for a donation belonging to the current donor.
 * Returns the image with Content-Disposition: attachment so the browser downloads it.
 */
export async function GET(request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "donor") {
      return new Response("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const donationId = searchParams.get("donationId");
    if (!donationId) {
      return new Response("donationId required", { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("FairShare");

    const donation = await db.collection("donations").findOne({
      _id: new ObjectId(donationId),
      donorId: new ObjectId(session.id),
    });

    if (!donation || !donation.certificateUrl) {
      return new Response("Certificate not found", { status: 404 });
    }

    const imageRes = await fetch(donation.certificateUrl, {
      headers: { "User-Agent": "FairShare-Download/1.0" },
    });

    if (!imageRes.ok) {
      return new Response("Failed to fetch certificate", { status: 502 });
    }

    const contentType = imageRes.headers.get("content-type") || "image/jpeg";
    const buffer = await imageRes.arrayBuffer();
    const ext = contentType.includes("png") ? "png" : "jpg";
    const filename = `donation-certificate-${donationId}.${ext}`;

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (e) {
    console.error("Donor download-certificate error:", e);
    return new Response("Internal error", { status: 500 });
  }
}
