import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Generate a unique filename with timestamp and random string
 * @param {string} originalName - Original file name
 * @returns {string} Unique filename
 */
function generateUniqueFilename(originalName) {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split(".").pop();
  return `${timestamp}_${randomStr}.${extension}`;
}

/**
 * Upload an image to Supabase Storage
 * @param {File} file - The file to upload
 * @param {string} folder - The folder path (e.g., 'certificates' or 'profiles/shelterId')
 * @returns {Promise<{url: string} | {error: string}>} The public URL or error
 */
export async function uploadImage(file, folder) {
  try {
    const filename = generateUniqueFilename(file.name);
    const filePath = `${folder}/${filename}`;

    const { data, error } = await supabase.storage
      .from("images")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Supabase upload error:", error);
      return { error: error.message };
    }

    // Get the public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("images").getPublicUrl(filePath);

    return { url: publicUrl };
  } catch (err) {
    console.error("Upload error:", err);
    return { error: err.message };
  }
}
