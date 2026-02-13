import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload an image to Cloudinary
 * @param {string} base64Data - Base64 encoded image data (with or without data URI prefix)
 * @param {string} folder - Folder to store the image in (e.g., 'certificates', 'profiles')
 * @returns {Promise<{success: boolean, url?: string, publicId?: string, error?: string}>}
 */
export async function uploadImage(base64Data, folder = "fairshare") {
  try {
    // Ensure base64 data has proper prefix
    let dataUri = base64Data;
    if (!base64Data.startsWith("data:")) {
      // Assume it's a JPEG if no prefix
      dataUri = `data:image/jpeg;base64,${base64Data}`;
    }

    const result = await cloudinary.uploader.upload(dataUri, {
      folder: `fairshare/${folder}`,
      resource_type: "image",
      transformation: [
        { quality: "auto:good" },
        { fetch_format: "auto" },
      ],
    });

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return {
      success: false,
      error: error.message || "ပုံတင်ရာတွင် အမှားဖြစ်ပွားပါသည်",
    };
  }
}

/**
 * Delete an image from Cloudinary
 * @param {string} publicId - The public ID of the image to delete
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deleteImage(publicId) {
  try {
    await cloudinary.uploader.destroy(publicId);
    return { success: true };
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    return {
      success: false,
      error: error.message || "ပုံဖျက်ရာတွင် အမှားဖြစ်ပွားပါသည်",
    };
  }
}

export default cloudinary;
