/**
 * Client-side helper: upload a File to Cloudinary via /api/upload (base64).
 * Use for: donor profile, donor certificates, donation screenshots, shelter profile images, activity images.
 * @param {File} file - Image file to upload
 * @param {string} folder - Cloudinary folder (e.g. 'profiles', 'donations/screenshots', 'activities')
 * @returns {Promise<{url: string} | {error: string}>}
 */
export async function uploadImageToCloudinary(file, folder = "general") {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result;
      fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, folder }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) resolve({ url: data.url });
          else resolve({ error: data.error || "ပုံတင်၍ မရပါ" });
        })
        .catch((err) => {
          console.error("Upload error:", err);
          resolve({ error: err.message || "ပုံတင်၍ မရပါ" });
        });
    };
    reader.onerror = () => resolve({ error: "ဖိုင်ဖတ်၍ မရပါ" });
    reader.readAsDataURL(file);
  });
}
