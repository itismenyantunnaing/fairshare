// lib/certificates/upload.ts
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function uploadPdfToCloudinary(pdfBytes: Uint8Array, certificateNo: string) {
  const base64 = Buffer.from(pdfBytes).toString("base64");
  const dataUri = `data:application/pdf;base64,${base64}`;

  // Use upload API with resource_type raw
  const res = await cloudinary.uploader.upload(dataUri, {
    resource_type: "raw",
    folder: "fairshare/certificates",
    public_id: certificateNo, // nice stable name
    overwrite: true,
  });

  return {
    secure_url: res.secure_url,
    public_id: res.public_id,
  };
}
