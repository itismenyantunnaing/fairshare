"use client";
import { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { uploadImage } from "@/lib/supabase";

export default function ShelterActivitiesPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [activities, setActivities] = useState([]);
  const [reliabilityScore, setReliabilityScore] = useState({ given: 0, total: 0, percentage: 0 });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const imageInputRef = useRef(null);
  const excelInputRef = useRef(null);

  const [formData, setFormData] = useState({
    distributionName: "",
    distributionDate: "",
    title: "",
    description: "",
  });
  const [images, setImages] = useState([]); // Array of { file: File, preview: string }
  const [excelFile, setExcelFile] = useState(null); // { file: File, name: string }

  // Auth check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (!data.success || !data.user) {
          router.push("/login");
          return;
        }

        const user = data.user;
        const isAdminUser = user.role === "admin" || user.role === "super_admin";
        const isOwnerUser = user.role === "shelter" && user.id === id;

        if (!isAdminUser && !isOwnerUser) {
          router.push("/login");
          return;
        }

        setIsOwner(isOwnerUser);
        setAuthChecked(true);
      } catch {
        router.push("/login");
      }
    };
    checkAuth();
  }, [id, router]);

  // Fetch activities
  useEffect(() => {
    if (!authChecked) return;
    const fetchActivities = async () => {
      try {
        const res = await fetch(`/api/shelters/${id}/activities`);
        const data = await res.json();
        if (data.success) {
          setActivities(data.activities);
          setReliabilityScore(data.reliabilityScore);
        }
      } catch (err) {
        setError("လှုပ်ရှားမှုများ ခေါ်ယူ၍ မရပါ။");
      } finally {
        setLoading(false);
      }
    };
    fetchActivities();
  }, [id, authChecked]);

  // Auto-dismiss messages
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 10) {
      setError("ဓာတ်ပုံ အများဆုံး ၁၀ ပုံသာ တင်နိုင်ပါသည်။");
      return;
    }

    const newImages = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...newImages]);
  };

  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = [
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/csv",
      ];
      if (!validTypes.includes(file.type)) {
        setError("Excel သို့မဟုတ် CSV ဖိုင်သာ တင်နိုင်ပါသည်။");
        return;
      }
      setExcelFile({ file, name: file.name });
    }
  };

  const removeImage = (idx) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const removeExcel = () => {
    setExcelFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Upload images to Supabase
      const imageUrls = [];
      for (const img of images) {
        const result = await uploadImage(img.file, `activities/${id}`);
        if (result.error) {
          throw new Error(`ဓာတ်ပုံ တင်၍ မရပါ: ${result.error}`);
        }
        imageUrls.push(result.url);
      }

      // Upload excel file if exists
      let excelUrl = null;
      if (excelFile) {
        const result = await uploadImage(excelFile.file, `activities/${id}/files`);
        if (result.error) {
          throw new Error(`Excel ဖိုင် တင်၍ မရပါ: ${result.error}`);
        }
        excelUrl = result.url;
      }

      // Create activity
      const res = await fetch(`/api/shelters/${id}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          images: imageUrls,
          excelFile: excelUrl,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess(data.message);
        setShowForm(false);
        setFormData({ distributionName: "", distributionDate: "", title: "", description: "" });
        setImages([]);
        setExcelFile(null);
        // Refresh activities
        const activitiesRes = await fetch(`/api/shelters/${id}/activities`);
        const activitiesData = await activitiesRes.json();
        if (activitiesData.success) {
          setActivities(activitiesData.activities);
          setReliabilityScore(activitiesData.reliabilityScore);
        }
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message || "လှုပ်ရှားမှု တင်၍ မရပါ။");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (activityId) => {
    if (!confirm("ဤလှုပ်ရှားမှုကို ဖျက်မှာ သေချာပါသလား?")) return;

    try {
      const res = await fetch(`/api/activities/${activityId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setActivities((prev) => prev.filter((a) => a._id !== activityId));
        setSuccess(data.message);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("ဖျက်၍ မရပါ။");
    }
  };

  const formatDate = (date) => {
    if (!date) return "မသိ";
    return new Date(date).toLocaleDateString("my-MM", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (!authChecked || loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">လှုပ်ရှားမှုများ ခေါ်ယူနေသည်...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link
              href={`/shelter/${id}`}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              ပရိုဖိုင်သို့ ပြန်သွားရန်
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">လှုပ်ရှားမှုများ</h1>
          </div>

          {/* Reliability Score */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-3 text-center">
            <p className="text-xs text-gray-500 mb-1">ယုံကြည်စိတ်ချရမှု အမှတ်</p>
            <p className="text-2xl font-bold text-blue-600">
              {reliabilityScore.given} / {reliabilityScore.total || reliabilityScore.given || 0}
            </p>
          </div>
        </div>

        {/* Messages */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-green-800 font-medium">{success}</p>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-red-800 font-medium">{error}</p>
          </div>
        )}

        {/* Add Activity Button - Only for owner */}
        {isOwner && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-sm font-semibold transition mb-6 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            လှုပ်ရှားမှု အသစ် တင်ရန်
          </button>
        )}

        {/* Activity Form */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">လှုပ်ရှားမှု အသစ် တင်ရန်</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Distribution Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    ဖြန့်ဝေမှု အမည် <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="distributionName"
                    type="text"
                    value={formData.distributionName}
                    onChange={handleChange}
                    placeholder="ဥပမာ - ဖေဖော်ဝါရီလ ဖြန့်ဝေမှု"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    ဖြန့်ဝေသည့် နေ့စွဲ
                  </label>
                  <input
                    name="distributionDate"
                    type="date"
                    value={formData.distributionDate}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  ခေါင်းစဉ် <span className="text-red-500">*</span>
                </label>
                <input
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="လှုပ်ရှားမှု ခေါင်းစဉ်"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  ဖော်ပြချက် <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="ဖြန့်ဝေမှုမှ ရရှိခဲ့သော ပစ္စည်းများနှင့် လှုပ်ရှားမှုများ အကြောင်း ဖော်ပြပါ"
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                  required
                />
              </div>

              {/* Images Upload */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  ဓာတ်ပုံများ (အများဆုံး ၁၀ ပုံ)
                </label>
                {images.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-2">
                    {images.map((img, idx) => (
                      <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200">
                        <img src={img.preview} alt={`ပုံ ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {images.length < 10 && (
                  <label className="block border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                      ref={imageInputRef}
                    />
                    <svg className="w-6 h-6 text-gray-400 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-xs text-gray-500">ဓာတ်ပုံများ ရွေးရန် နှိပ်ပါ</p>
                  </label>
                )}
              </div>

              {/* Excel Upload */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  အလှူပစ္စည်း စာရင်း (Excel/CSV)
                </label>
                {excelFile ? (
                  <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-sm text-gray-700">{excelFile.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={removeExcel}
                      className="text-red-500 hover:text-red-700 text-sm font-medium"
                    >
                      ဖယ်ရှားရန်
                    </button>
                  </div>
                ) : (
                  <label className="block border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition cursor-pointer">
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleExcelUpload}
                      className="hidden"
                      ref={excelInputRef}
                    />
                    <svg className="w-6 h-6 text-gray-400 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-xs text-gray-500">Excel သို့မဟုတ် CSV ဖိုင် တင်ရန်</p>
                  </label>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white py-2.5 rounded-lg text-sm font-semibold transition"
                >
                  {submitting ? "တင်နေသည်..." : "တင်ရန်"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setFormData({ distributionName: "", distributionDate: "", title: "", description: "" });
                    setImages([]);
                    setExcelFile(null);
                  }}
                  disabled={submitting}
                  className="flex-1 bg-white hover:bg-gray-50 text-gray-700 py-2.5 rounded-lg text-sm font-semibold transition border border-gray-300"
                >
                  ပယ်ဖျက်ရန်
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Activities List */}
        {activities.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="text-gray-500">လှုပ်ရှားမှု မရှိသေးပါ</p>
            {isOwner && (
              <p className="text-sm text-gray-400 mt-1">ဖြန့်ဝေမှုအတွက် တုံ့ပြန်ချက် တင်ရန် အထက်ပါ ခလုတ်ကို နှိပ်ပါ</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div
                key={activity._id}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
              >
                {/* Activity Images */}
                {activity.images?.length > 0 && (
                  <div className="h-48 bg-gray-100 overflow-hidden">
                    <img
                      src={activity.images[0]}
                      alt={activity.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="p-5">
                  {/* Distribution Badge */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">
                      {activity.distributionName}
                    </span>
                    {activity.distributionDate && (
                      <span className="text-xs text-gray-400">
                        {formatDate(activity.distributionDate)}
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{activity.title}</h3>
                  <p className="text-sm text-gray-600 line-clamp-3">{activity.description}</p>

                  {/* Meta Info */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      {activity.images?.length > 0 && (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {activity.images.length} ပုံ
                        </span>
                      )}
                      {activity.excelFile && (
                        <a
                          href={activity.excelFile}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Excel
                        </a>
                      )}
                      <span>{formatDate(activity.createdAt)}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/activities/${activity._id}`}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        အပြည့်အစုံ ကြည့်ရန်
                      </Link>
                      {isOwner && (
                        <button
                          onClick={() => handleDelete(activity._id)}
                          className="text-xs text-red-500 hover:text-red-700 font-medium ml-2"
                        >
                          ဖျက်ရန်
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
