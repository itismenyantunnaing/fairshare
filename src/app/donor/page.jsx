"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { uploadImageToCloudinary } from "@/lib/uploadClient";

const STATUS_LABEL = {
  pending: "စီမံခန့်ခွဲသူ အတည်ပြုရန် စောင့်ဆိုင်းနေသည်",
  approved: "အတည်ပြုပြီး",
  rejected: "ငြင်းပယ်ပြီး",
};

const CATEGORY_LABEL = { money: "ငွေကြေး", medical: "ဆေးဝါး", clothing: "အဝတ်အစား", food: "အစားအစာ" };
const CATEGORY_ICON = { money: "💰", medical: "💊", clothing: "👕", food: "🍚" };
const RICE_LABEL = { one_bag: "တအိတ် (၂၄ ပြည်)", half_bag: "တအိတ် ခွဲ (၁၂ ပြည်)", custom_pyi: "စိတ်ကြိုက် ပြည်" };
const ITEM_LABEL = {
  medical_pack: "ဆေးသေတ္တာ", bandages: "ပတ်တီး",
  shirt_child: "ကလေး အင်္ကျီ", shirt_adult: "လူကြီး အင်္ကျီ",
  pants_child: "ကလေး ဘောင်းဘီ", pants_adult: "လူကြီး ဘောင်းဘီ",
  oil_bottle: "ဆီပုလင်း", other: "အခြား",
};

function donationSummary(d) {
  const cat = d.category || "money";
  if (cat === "money") return `${d.amount?.toLocaleString()} MMK · ${d.paymentMethod === "kpay" ? "KPay" : "Wave"}`;
  if (cat === "food") {
    const parts = [];
    if (d.rice?.option) {
      if (d.rice.option === "custom_pyi" && d.rice.customPyi) parts.push(`${d.rice.customPyi} ပြည်`);
      else if (d.rice.quantity != null && d.rice.quantity > 1) parts.push(`${RICE_LABEL[d.rice.option] || d.rice.option} ×${d.rice.quantity}`);
      else parts.push(RICE_LABEL[d.rice.option] || d.rice.option);
    }
    if (d.foodItems?.length) parts.push(...d.foodItems.map(i => `${i.label || ITEM_LABEL[i.type] || i.type} ×${i.quantity}`));
    return parts.length ? parts.join(", ") : CATEGORY_LABEL.food;
  }
  const items = cat === "medical" ? d.medicalItems : d.clothingItems;
  if (!items?.length) return CATEGORY_LABEL[cat];
  return items.map(i => `${i.label || ITEM_LABEL[i.type] || i.type} ×${i.quantity}`).join(", ");
}

export default function DonorProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [donor, setDonor] = useState(null);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (!data.success || !data.user || data.user.role !== "donor") {
          router.push("/login");
          return;
        }
        setUser(data.user);
      } catch {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };
    check();
  }, [router]);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      try {
        const [profileRes, donationsRes] = await Promise.all([
          fetch("/api/donor/profile"),
          fetch("/api/donor/donations"),
        ]);
        const profileData = await profileRes.json();
        const donationsData = await donationsRes.json();
        if (profileData.success && profileData.donor) {
          setDonor(profileData.donor);
          setFormData({
            name: profileData.donor.name || "",
            email: profileData.donor.email || "",
            password: "",
            confirmPassword: "",
          });
        }
        if (donationsData.success) setDonations(donationsData.donations);
      } catch (err) {
        setError("အချက်အလက် ခေါ်ယူ၍ မရပါ။");
      }
    };
    fetchProfile();
  }, [user]);

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(t);
    }
  }, [success]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImageFile(file);
      setProfileImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    if (formData.password && formData.password !== formData.confirmPassword) {
      setError("စကားဝှက် နှစ်ကြိမ် ကိုက်ညီပါစေ။");
      setSaving(false);
      return;
    }
    try {
      let profileImageUrl = donor?.profileImage || null;
      if (profileImageFile) {
        const uploadResult = await uploadImageToCloudinary(profileImageFile, "donor-profiles");
        if (uploadResult.error) {
          setError(uploadResult.error);
          setSaving(false);
          return;
        }
        profileImageUrl = uploadResult.url;
      }

      const body = {
        name: formData.name,
        email: formData.email,
        profileImage: profileImageUrl,
      };
      if (formData.password) body.password = formData.password;

      const res = await fetch("/api/donor/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(data.message);
        setEditMode(false);
        setFormData((prev) => ({ ...prev, password: "", confirmPassword: "" }));
        setProfileImageFile(null);
        setProfileImagePreview(null);
        const profileRes = await fetch("/api/donor/profile");
        const profileData = await profileRes.json();
        if (profileData.success) setDonor(profileData.donor);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("သိမ်းဆည်း၍ မရပါ။");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString("my-MM", { year: "numeric", month: "short", day: "numeric" }) : "");

  const getInitials = (name) => {
    if (!name) return "?";
    const w = name.trim().split(/\s+/);
    return w.length >= 2 ? (w[0][0] + w[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
  };

  if (loading || !user) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const displayImage = profileImagePreview || donor?.profileImage;
  const initials = getInitials(donor?.name || user?.name);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">အလှူရှင် ပရိုဖိုင်</h1>
          <button
            type="button"
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              router.push("/");
              router.refresh();
            }}
            className="text-sm text-gray-500 hover:text-red-600 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition"
          >
            ထွက်ရန်
          </button>
        </div>

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

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-start gap-6">
            <div className="flex-shrink-0">
              {displayImage ? (
                <img
                  src={displayImage}
                  alt={donor?.name}
                  className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">{initials}</span>
                </div>
              )}
              {editMode && (
                <label className="block mt-2 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <span className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer">ပုံပြောင်းရန်</span>
                </label>
              )}
            </div>
            <div className="flex-1 min-w-0">
              {editMode ? (
                <form onSubmit={handleSave} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">အမည်</label>
                    <input
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">အီးမေးလ်</label>
                    <input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">စကားဝှက် အသစ် (မပြောင်းလဲလိုလျှင် ဗလာထားပါ)</label>
                    <input
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  {formData.password && (
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">စကားဝှက် ထပ်ထည့်ပါ</label>
                      <input
                        name="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="••••••••"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  )}
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2.5 rounded-lg text-sm font-semibold transition"
                    >
                      {saving ? "သိမ်းနေသည်..." : "သိမ်းဆည်းရန်"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditMode(false);
                        setFormData({ name: donor?.name || "", email: donor?.email || "", password: "", confirmPassword: "" });
                        setProfileImageFile(null);
                        setProfileImagePreview(null);
                      }}
                      disabled={saving}
                      className="flex-1 bg-white hover:bg-gray-50 text-gray-700 py-2.5 rounded-lg text-sm font-semibold border border-gray-300 transition"
                    >
                      ပယ်ဖျက်ရန်
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <p className="text-lg font-semibold text-gray-900">{donor?.name}</p>
                  <p className="text-sm text-gray-500">{donor?.email}</p>
                  <button
                    type="button"
                    onClick={() => setEditMode(true)}
                    className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    ပရိုဖိုင် ပြင်ဆင်ရန်
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">အလှူ မှတ်တမ်း</h2>
              <Link
                href="/donate"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                လှူဒါန်းရန်
              </Link>
            </div>
            {donations.length === 0 ? (
              <p className="text-sm text-gray-500">အလှူ မှတ်တမ်း မရှိသေးပါ။</p>
            ) : (
              <ul className="space-y-3">
                {donations.map((d) => {
                  const cat = d.category || "money";
                  return (
                    <li
                      key={d.id}
                      className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm">{CATEGORY_ICON[cat]}</span>
                          <span className="text-xs text-gray-500">{CATEGORY_LABEL[cat]}</span>
                        </div>
                        <p className="font-medium text-gray-900 text-sm truncate">{donationSummary(d)}</p>
                        <p className="text-xs text-gray-500">{formatDate(d.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded-full ${
                            d.status === "approved"
                              ? "bg-green-100 text-green-800"
                              : d.status === "rejected"
                              ? "bg-red-100 text-red-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {STATUS_LABEL[d.status] || d.status}
                        </span>
                        {d.status === "approved" && d.certificateUrl && (
                          <a
                            href={d.certificateUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            လက်မှတ်
                          </a>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {(donor?.certificates?.filter((c) => c?.url)?.length ?? 0) > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-100">
                <h2 className="font-semibold text-gray-900 mb-3">လက်မှတ်များ</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {donor.certificates
                    .filter((cert) => cert?.url)
                    .map((cert, idx) => (
                      <a
                        key={cert.donationId || idx}
                        href={cert.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block rounded-lg border border-gray-200 overflow-hidden hover:border-blue-300 transition bg-gray-50"
                      >
                        <img
                          src={cert.url}
                          alt={`လက်မှတ် ${idx + 1}`}
                          className="w-full aspect-[3/4] object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect fill='%23f3f4f6' width='200' height='200'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-size='14' font-family='sans-serif'%3Eပုံ မတင်နိုင်ပါ%3C/text%3E%3C/svg%3E";
                          }}
                        />
                      </a>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
