"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { uploadImageToCloudinary } from "@/lib/uploadClient";
import { useToast } from "@/context/ToastContext";

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

function formatDateWithTime(d) {
  return d ? new Date(d).toLocaleDateString("my-MM", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "";
}

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
  const { showToast } = useToast();
  const [user, setUser] = useState(null);
  const [donor, setDonor] = useState(null);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const [selectedDonation, setSelectedDonation] = useState(null);
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
        showToast("အချက်အလက် ခေါ်ယူ၍ မရပါ။", "error");
      }
    };
    fetchProfile();
  }, [user]);

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
    if (formData.password && formData.password !== formData.confirmPassword) {
      showToast("စကားဝှက် နှစ်ကြိမ် ကိုက်ညီပါစေ။", "error");
      setSaving(false);
      return;
    }
    try {
      let profileImageUrl = donor?.profileImage || null;
      if (profileImageFile) {
        const uploadResult = await uploadImageToCloudinary(profileImageFile, "donor-profiles");
        if (uploadResult.error) {
          showToast(uploadResult.error, "error");
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
        showToast(data.message, "success");
        setEditMode(false);
        setFormData((prev) => ({ ...prev, password: "", confirmPassword: "" }));
        setProfileImageFile(null);
        setProfileImagePreview(null);
        const profileRes = await fetch("/api/donor/profile");
        const profileData = await profileRes.json();
        if (profileData.success) setDonor(profileData.donor);
      } else {
        showToast(data.error, "error");
      }
    } catch (err) {
      showToast("သိမ်းဆည်း၍ မရပါ။", "error");
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {donations.map((d) => {
                  const cat = d.category || "money";
                  return (
                    <div
                      key={d.id}
                      className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:border-blue-200 transition cursor-pointer"
                      onClick={() => setSelectedDonation(d)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base">{CATEGORY_ICON[cat]}</span>
                        <span className="text-xs font-medium text-gray-500">{CATEGORY_LABEL[cat]}</span>
                      </div>
                      <p className="font-semibold text-gray-900 text-sm">{donationSummary(d)}</p>
                      <p className="text-sm text-gray-500 truncate mt-0.5">{donor?.name || user?.name}</p>
                      <p className="text-xs text-gray-400 mt-1">{formatDate(d.createdAt)}</p>
                      <div className="flex items-center justify-between gap-2 mt-3 flex-wrap">
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
                            href={`/api/donor/download-certificate?donationId=${d.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            လက်မှတ် ဒေါင်းလုဒ်လုပ်ရန်
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Donation detail modal (read-only, same structure as admin) */}
            {selectedDonation && (() => {
              const sd = selectedDonation;
              const sdCat = sd.category || "money";
              return (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
                  onClick={() => setSelectedDonation(null)}
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="donation-detail-title"
                >
                  <div
                    className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="p-5 border-b border-gray-100 flex-shrink-0">
                      <div className="flex justify-between items-start">
                        <h3 id="donation-detail-title" className="font-semibold text-gray-900">အလှူ အသေးစိတ်</h3>
                        <button type="button" onClick={() => setSelectedDonation(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none p-1" aria-label="ပိတ်ရန်">✕</button>
                      </div>
                    </div>
                    <div className="p-5 space-y-3 text-sm overflow-y-auto flex-1">
                      <p><span className="text-gray-500">အမျိုးအစား:</span> {CATEGORY_ICON[sdCat]} {CATEGORY_LABEL[sdCat]}</p>

                      {sdCat === "money" && (
                        <>
                          <p><span className="text-gray-500">ပမာဏ:</span> {Number(sd.amount).toLocaleString()} MMK</p>
                          <p><span className="text-gray-500">နည်းလမ်း:</span> {sd.paymentMethod === "kpay" ? "KPay" : "Wave"}</p>
                        </>
                      )}

                      {sdCat === "medical" && sd.medicalItems?.length > 0 && (
                        <div>
                          <span className="text-gray-500">ဆေးဝါး ပစ္စည်းများ:</span>
                          <ul className="mt-1 ml-4 list-disc text-gray-700">
                            {sd.medicalItems.map((it, i) => (
                              <li key={i}>{it.label || ITEM_LABEL[it.type] || it.type} — {it.quantity}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {sdCat === "clothing" && sd.clothingItems?.length > 0 && (
                        <div>
                          <span className="text-gray-500">အဝတ်အစား ပစ္စည်းများ:</span>
                          <ul className="mt-1 ml-4 list-disc text-gray-700">
                            {sd.clothingItems.map((it, i) => (
                              <li key={i}>{it.label || ITEM_LABEL[it.type] || it.type} — {it.quantity}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {sdCat === "food" && (
                        <div>
                          {sd.rice?.option && (
                            <p><span className="text-gray-500">ဆန်:</span> {sd.rice.option === "custom_pyi" && sd.rice.customPyi != null ? `${sd.rice.customPyi} ပြည်` : (RICE_LABEL[sd.rice.option] || sd.rice.option)}{sd.rice.quantity != null && sd.rice.quantity > 1 ? ` ×${sd.rice.quantity}` : ""}</p>
                          )}
                          {sd.foodItems?.length > 0 && (
                            <div>
                              <span className="text-gray-500">အခြား အစားအစာ:</span>
                              <ul className="mt-1 ml-4 list-disc text-gray-700">
                                {sd.foodItems.map((it, i) => (
                                  <li key={i}>{it.label || ITEM_LABEL[it.type] || it.type} — {it.quantity}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          <p><span className="text-gray-500">စုစုပေါင်း ပြည် (ဤအလှူ):</span> <span className="font-semibold">{Number(sd.totalPyi || 0).toLocaleString()} ပြည်</span></p>
                        </div>
                      )}

                      <p><span className="text-gray-500">အမည်:</span> {sd.name}</p>
                      <p><span className="text-gray-500">အီးမေးလ်:</span> {sd.email}</p>
                      {sd.message && <p><span className="text-gray-500">မှတ်ချက်:</span> {sd.message}</p>}
                      <p><span className="text-gray-500">နေ့စွဲ:</span> {formatDateWithTime(sd.createdAt)}</p>

                      {sd.transactionScreenshot && (
                        <div className="mt-4">
                          <p className="text-xs text-gray-500 mb-2">ငွေလွှဲပုံ</p>
                          <a href={sd.transactionScreenshot} target="_blank" rel="noopener noreferrer" className="block rounded-lg overflow-hidden border border-gray-200">
                            <img src={sd.transactionScreenshot} alt="Screenshot" className="w-full max-h-48 object-contain bg-gray-50" />
                          </a>
                        </div>
                      )}

                      {sd.status === "approved" && sd.certificateUrl && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <p className="text-xs text-gray-500 mb-2">လက်မှတ်</p>
                          <a href={sd.certificateUrl} target="_blank" rel="noopener noreferrer" className="block rounded-lg overflow-hidden border border-gray-200 mb-3">
                            <img src={sd.certificateUrl} alt="လက်မှတ်" className="w-full max-h-48 object-contain bg-gray-50" onError={(e) => { e.target.style.display = "none"; }} />
                          </a>
                          <a
                            href={`/api/donor/download-certificate?donationId=${sd.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            လက်မှတ် ဒေါင်းလုဒ်လုပ်ရန်
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
