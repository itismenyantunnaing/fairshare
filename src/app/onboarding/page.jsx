"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Tesseract from "tesseract.js";
import { uploadImage } from "@/lib/supabase";

export default function HostelOnboarding() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    hostelName: "",
    email: "",
    password: "",
    confirmPassword: "",
    address: "",
    city: "",
    phone: "",
  });
  const [licenseFile, setLicenseFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  // Auto-dismiss success/warning messages after 10 seconds
  useEffect(() => {
    if (result) {
      const timer = setTimeout(() => {
        setResult(null);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [result]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("ဖိုင်အရွယ်အစား 5MB ထက်မကျော်ရပါ");
      e.target.value = "";
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("ကျေးဇူးပြု၍ မှန်ကန်သော ပုံဖိုင်ကို တင်ပေးပါ");
      e.target.value = "";
      return;
    }

    setLicenseFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLoadingStep("လက်မှတ်ကို စကန်ဖတ်နေသည်...");
    setResult(null);

    // Validate password match
    if (formData.password !== formData.confirmPassword) {
      setResult({
        type: "error",
        message: "စကားဝှက်များ မတူညီပါ။ ထပ်မံစစ်ဆေးပါ။",
      });
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setResult({
        type: "error",
        message: "စကားဝှက် အနည်းဆုံး ၆ လုံး ရှိရမည်။",
      });
      setLoading(false);
      return;
    }

    try {
      // Convert image to base64
      const reader = new FileReader();
      const base64Image = await new Promise((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(licenseFile);
      });

      // Run OCR in the browser (fast with Web Workers)
      let ocrText = "";
      let ocrConfidence = 0;
      try {
        const { data } = await Tesseract.recognize(base64Image, "eng");
        ocrText = data.text;
        ocrConfidence = data.confidence;
      } catch (ocrError) {
        console.error("OCR failed:", ocrError);
        // Continue without OCR — server will set status to pending
      }

      // Upload image to Supabase Storage
      setLoadingStep("ပုံတင်နေသည်...");
      const uploadResult = await uploadImage(licenseFile, "certificates");

      if (uploadResult.error) {
        setResult({
          type: "error",
          message: uploadResult.error || "ပုံတင်ရာတွင် အမှားဖြစ်ပွားပါသည်။",
        });
        setLoading(false);
        return;
      }

      setLoadingStep("အကောင့်ဖွင့်နေသည်...");

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hostelName: formData.hostelName,
          email: formData.email,
          password: formData.password,
          address: formData.address,
          city: formData.city,
          phone: formData.phone,
          licenseImageUrl: uploadResult.url,
          ocrText,
          ocrConfidence,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const isPending = data.verification.status === "pending";

        // Redirect to profile page immediately if AI verified (user is logged in via cookie)
        if (isPending && data.id) {
          router.push(`/shelter/${data.id}`);
          router.refresh();
          return;
        }

        setResult({
          type: "warning",
          message: data.verification.message,
          status: data.verification.status,
        });
      } else {
        setResult({
          type: "error",
          message: data.error || "မှတ်ပုံတင်ခြင်း မအောင်မြင်ပါ။ ထပ်မံကြိုးစားပါ။",
        });
      }
    } catch (error) {
      setResult({
        type: "error",
        message: "ကွန်ရက်ချို့ယွင်းချက်ဖြစ်ပါသည်။ အင်တာနက်ချိတ်ဆက်မှုကို စစ်ဆေးပြီး ထပ်မံကြိုးစားပါ။",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4">
      <div className="max-w-xl mx-auto">

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              ခိုလှုံရာအိမ် မှတ်ပုံတင်ခြင်း
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              အတည်ပြုခြင်းအတွက် သင့်ခိုလှုံရာအိမ် လက်မှတ်ကို တင်ပေးပါ။
              ကျွန်ုပ်တို့သည် အလိုအလျောက် စစ်ဆေးမှုများပြုလုပ်ပြီးနောက် စီမံခန့်ခွဲသူက ကိုယ်တိုင်စစ်ဆေးပါမည်။
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Shelter Name */}
            <div>
              <label
                htmlFor="hostelName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                ခိုလှုံရာအိမ် အမည်
              </label>
              <input
                id="hostelName"
                name="hostelName"
                type="text"
                placeholder="ဥပမာ - နွေဦးခိုလှုံရာအိမ်"
                value={formData.hostelName}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                အီးမေးလ်
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="ဥပမာ - contact@shelter.com"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
              <p className="text-xs text-gray-400 mt-1">
                သင့်မှတ်ပုံတင်ခြင်း အခြေအနေကို ဤအီးမေးလ်မှတဆင့် အကြောင်းကြားပါမည်။
              </p>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                စကားဝှက်
              </label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="အနည်းဆုံး ၆ လုံး"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                စကားဝှက် အတည်ပြုရန်
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="စကားဝှက်ကို ထပ်မံထည့်သွင်းပါ"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                minLength={6}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>

            {/* Address */}
            <div>
              <label
                htmlFor="address"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                လိပ်စာအပြည့်အစုံ
              </label>
              <input
                id="address"
                name="address"
                type="text"
                placeholder="ဥပမာ - အမှတ် ၁၂၃၊ ဗိုလ်ချုပ်လမ်း၊ မင်္ဂလာတောင်ညွန့်မြို့နယ်"
                value={formData.address}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>

            {/* City */}
            <div>
              <label
                htmlFor="city"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                မြို့
              </label>
              <input
                id="city"
                name="city"
                type="text"
                placeholder="ဥပမာ - ရန်ကုန်"
                value={formData.city}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>

            {/* Phone */}
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                ဖုန်းနံပါတ်
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder="ဥပမာ - +95 9 123 456 789"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>

            {/* Certificate Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ခိုလှုံရာအိမ် လက်မှတ် / လိုင်စင်
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  required
                  className="hidden"
                  id="certificateUpload"
                  ref={fileInputRef}
                />
                <label htmlFor="certificateUpload" className="cursor-pointer">
                  {imagePreview ? (
                    <div>
                      <img
                        src={imagePreview}
                        alt="လက်မှတ် အကြိုကြည့်ရှုခြင်း"
                        className="max-h-48 mx-auto rounded-lg mb-2"
                      />
                      <p className="text-sm text-gray-500">
                        ပုံပြောင်းရန် နှိပ်ပါ
                      </p>
                    </div>
                  ) : (
                    <div>
                      <svg
                        className="w-10 h-10 text-gray-400 mx-auto mb-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <p className="text-sm text-gray-600 font-medium">
                        သင့်လက်မှတ် ပုံကို တင်ပေးပါ
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        PNG, JPG - 5MB ထိ
                      </p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg font-semibold text-white transition ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  {loadingStep || "လုပ်ဆောင်နေသည်..."}
                </span>
              ) : (
                "မှတ်ပုံတင်ခြင်း တင်သွင်းရန်"
              )}
            </button>
          </form>

          {/* Result Message */}
          {result && (
            <div
              className={`mt-6 p-4 rounded-lg border ${
                result.type === "success"
                  ? "bg-green-50 border-green-200 text-green-800"
                  : result.type === "warning"
                    ? "bg-amber-50 border-amber-200 text-amber-800"
                    : "bg-red-50 border-red-200 text-red-800"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-lg mt-0.5">
                  {result.type === "success"
                    ? "\u2713"
                    : result.type === "warning"
                      ? "!"
                      : "\u2717"}
                </span>
                <div>
                  <p className="font-medium text-sm">
                    {result.type === "success"
                      ? "မှတ်ပုံတင်ခြင်း တင်သွင်းပြီးပါပြီ"
                      : result.type === "warning"
                        ? "အတည်ပြုခြင်း ပြဿနာ"
                        : "အမှားအယွင်း"}
                  </p>
                  <p className="text-sm mt-1">{result.message}</p>
                  {result.shelterId && (
                    <a
                      href={`/shelter/${result.shelterId}`}
                      className="inline-block mt-3 text-sm font-semibold text-green-700 underline hover:text-green-900"
                    >
                      ပရိုဖိုင် စာမျက်နှာသို့ သွားရန်
                    </a>
                  )}
                  {result.status && (
                    <p className="text-xs mt-2 opacity-75">
                      အခြေအနေ:{" "}
                      <span className="font-medium uppercase">
                        {result.status}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="mt-6 bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-3 text-sm">
            အတည်ပြုခြင်း လုပ်ငန်းစဉ်
          </h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">
                1
              </span>
              <p className="text-sm text-gray-600">
                သင့်ခိုလှုံရာအိမ် လက်မှတ် သို့မဟုတ် လိုင်စင်ပုံကို တင်ပေးပါ။
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">
                2
              </span>
              <p className="text-sm text-gray-600">
                ကျွန်ုပ်တို့၏ စနစ်က AI ဖြင့် စာရွက်စာတမ်းကို အလိုအလျောက် စစ်ဆေးပါမည်။
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">
                3
              </span>
              <p className="text-sm text-gray-600">
                အတည်ပြုပါက စီမံခန့်ခွဲသူက ကိုယ်တိုင်စစ်ဆေးပြီး သင့်မှတ်ပုံတင်ခြင်းကို အတည်ပြုပါမည်။
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
