"use client";
import { useState, useRef, useEffect } from "react";

export default function HostelOnboarding() {
  const [formData, setFormData] = useState({
    hostelName: "",
    email: "",
    address: "",
    city: "",
    phone: "",
  });
  const [licenseFile, setLicenseFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
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
      alert("File size must be less than 5MB");
      e.target.value = "";
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid image file");
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
    setResult(null);

    try {
      // Convert image to base64 for submission
      const reader = new FileReader();
      const base64Image = await new Promise((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(licenseFile);
      });

      const response = await fetch("/api/hostels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          licenseImage: base64Image,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const isPending = data.verification.status === "pending";
        setResult({
          type: isPending ? "success" : "warning",
          message: data.verification.message,
          status: data.verification.status,
        });

        // Reset form when registration is accepted (pending for review)
        if (isPending) {
          setFormData({ hostelName: "", email: "", address: "", city: "", phone: "" });
          setLicenseFile(null);
          setImagePreview(null);
          // Reset the file input element so a new image can be uploaded
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        }
      } else {
        setResult({
          type: "error",
          message: data.error || "Registration failed. Please try again.",
        });
      }
    } catch (error) {
      setResult({
        type: "error",
        message: "Network error. Please check your connection and try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            FairShare
          </h1>
          <p className="text-gray-500 mt-1 text-sm">Hostel Management Platform</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Register Your Hostel
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Upload your hostel certificate for verification. We use automated
              checks followed by manual admin review.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Hostel Name */}
            <div>
              <label
                htmlFor="hostelName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Hostel Name
              </label>
              <input
                id="hostelName"
                name="hostelName"
                type="text"
                placeholder="e.g. Sunrise Hostel"
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
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="e.g. owner@sunrisehostel.com"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
              <p className="text-xs text-gray-400 mt-1">
                We will notify you about your registration status via this email.
              </p>
            </div>

            {/* Address */}
            <div>
              <label
                htmlFor="address"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Full Address
              </label>
              <input
                id="address"
                name="address"
                type="text"
                placeholder="e.g. 123 Main Street, Township"
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
                City
              </label>
              <input
                id="city"
                name="city"
                type="text"
                placeholder="e.g. Yangon"
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
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder="e.g. +95 9 123 456 789"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>

            {/* Certificate Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hostel Certificate / License
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
                        alt="Certificate preview"
                        className="max-h-48 mx-auto rounded-lg mb-2"
                      />
                      <p className="text-sm text-gray-500">
                        Click to change image
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
                        Upload your certificate image
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        PNG, JPG up to 5MB
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
                  Verifying Certificate...
                </span>
              ) : (
                "Submit Registration"
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
                      ? "Registration Submitted"
                      : result.type === "warning"
                      ? "Verification Issue"
                      : "Error"}
                  </p>
                  <p className="text-sm mt-1">{result.message}</p>
                  {result.status && (
                    <p className="text-xs mt-2 opacity-75">
                      Status: <span className="font-medium uppercase">{result.status}</span>
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
            How Verification Works
          </h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">
                1
              </span>
              <p className="text-sm text-gray-600">
                Upload your hostel certificate or license image.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">
                2
              </span>
              <p className="text-sm text-gray-600">
                Our system automatically verifies the document using AI.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">
                3
              </span>
              <p className="text-sm text-gray-600">
                If verified, an admin will manually review and approve your
                registration.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
