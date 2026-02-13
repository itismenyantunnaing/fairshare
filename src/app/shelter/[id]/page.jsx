"use client";
import { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { uploadImage } from "@/lib/supabase";

const STATUS_BADGE = {
  pending: {
    label: "စီမံခန့်ခွဲသူ အတည်ပြုရန် စောင့်ဆိုင်းနေသည်",
    color: "bg-amber-100 text-amber-800 border-amber-200",
  },
  approved: {
    label: "အတည်ပြုပြီး",
    color: "bg-green-100 text-green-800 border-green-200",
  },
};

export default function ShelterProfile({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [isOwner, setIsOwner] = useState(false); // true if shelter owner, false if admin viewing
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const imageInputRef = useRef(null);

  const [formData, setFormData] = useState({
    hostelName: "",
    email: "",
    address: "",
    city: "",
    phone: "",
    adults: 0,
    children: 0,
  });
  const [profileImages, setProfileImages] = useState([]);
  const [newImages, setNewImages] = useState([]); // Array of { file: File, preview: string }

  // Auth check — verify logged-in user owns this profile OR is an admin
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
          // Not admin and not owner — redirect
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

  // Auto-dismiss success message
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Fetch profile data (only after auth is confirmed)
  useEffect(() => {
    if (!authChecked) return;
    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/hostels/${id}/profile`);
        const data = await res.json();
        if (data.success) {
          setProfile(data.profile);
          setFormData({
            hostelName: data.profile.hostelName || "",
            email: data.profile.email || "",
            address: data.profile.address || "",
            city: data.profile.city || "",
            phone: data.profile.phone || "",
            adults: data.profile.population?.adults || 0,
            children: data.profile.population?.children || 0,
          });
          setProfileImages(data.profile.profileImages || []);
        } else {
          setError(data.error);
        }
      } catch (err) {
        setError("ပရိုဖိုင် ခေါ်ယူ၍ မရပါ။ ထပ်မံကြိုးစားပါ။");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id, authChecked]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: Math.max(0, parseInt(value) || 0) }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const totalImages = profileImages.length + newImages.length + files.length;

    if (totalImages > 5) {
      alert("ပရိုဖိုင်ပုံ အများဆုံး ၅ ပုံသာ တင်နိုင်ပါသည်။");
      return;
    }

    files.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} - ဖိုင်အရွယ်အစား 5MB ထက်မကျော်ရပါ`);
        return;
      }
      if (!file.type.startsWith("image/")) return;

      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImages((prev) => [...prev, { file, preview: reader.result }]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const removeExistingImage = (index) => {
    setProfileImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Upload new images to Supabase Storage
      const uploadedUrls = [];
      for (const { file } of newImages) {
        const result = await uploadImage(file, `profiles/${id}`);
        if (result.error) {
          setError(result.error || "ပုံတင်ရာတွင် အမှားဖြစ်ပွားပါသည်။");
          setSaving(false);
          return;
        }
        uploadedUrls.push(result.url);
      }

      // Combine existing URLs with newly uploaded URLs
      const allImages = [...profileImages, ...uploadedUrls];

      const res = await fetch(`/api/hostels/${id}/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hostelName: formData.hostelName,
          email: formData.email,
          address: formData.address,
          city: formData.city,
          phone: formData.phone,
          population: {
            adults: formData.adults,
            children: formData.children,
          },
          profileImages: allImages,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess(data.message);
        setProfileImages(allImages);
        setNewImages([]);
        setEditMode(false);
        // Refresh profile
        setProfile((prev) => ({
          ...prev,
          hostelName: formData.hostelName,
          email: formData.email,
          address: formData.address,
          city: formData.city,
          phone: formData.phone,
          population: { adults: formData.adults, children: formData.children },
          profileImages: allImages,
        }));
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("သိမ်းဆည်းခြင်း မအောင်မြင်ပါ။ ထပ်မံကြိုးစားပါ။");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        hostelName: profile.hostelName || "",
        email: profile.email || "",
        address: profile.address || "",
        city: profile.city || "",
        phone: profile.phone || "",
        adults: profile.population?.adults || 0,
        children: profile.population?.children || 0,
      });
      setProfileImages(profile.profileImages || []);
      setNewImages([]);
    }
    setEditMode(false);
    setError(null);
  };

  if (!authChecked || loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">ပရိုဖိုင် ခေါ်ယူနေသည်...</p>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">ဝင်ရောက်ခွင့် မရှိပါ</h2>
          <p className="text-gray-500 text-sm">{error}</p>
          <a
            href="/"
            className="inline-block mt-6 text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            ပင်မစာမျက်နှာသို့ ပြန်သွားရန်
          </a>
        </div>
      </div>
    );
  }

  const isApproved = profile?.verification?.status === "approved";
  const isPending = profile?.verification?.status === "pending";
  const statusInfo = STATUS_BADGE[profile?.verification?.status] || STATUS_BADGE.pending;
  const allCurrentImages = [...profileImages, ...newImages.map((img) => img.preview)];

  // Get initials from shelter name (first 2 characters or first letters of words)
  const getInitials = (name) => {
    if (!name) return "?";
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const shelterInitials = getInitials(profile?.hostelName);
  const hasProfileImage = profileImages.length > 0;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            {/* Profile Avatar */}
            <div className="flex-shrink-0">
              {hasProfileImage ? (
                <img
                  src={profileImages[0]}
                  alt={profile?.hostelName}
                  className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-xl font-bold text-white">{shelterInitials}</span>
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  {editMode ? "ပရိုဖိုင် ပြင်ဆင်ရန်" : profile?.hostelName}
                </h1>
                {/* Verified Badge */}
                {isApproved && !editMode && (
                  <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    အတည်ပြုပြီး
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-2">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${statusInfo.color}`}>
                  {statusInfo.label}
                </span>
              </div>
            </div>
          </div>
          {isOwner && (
            <button
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" });
                router.push("/");
                router.refresh();
              }}
              className="text-sm text-gray-500 hover:text-red-600 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition"
            >
              ထွက်ရန်
            </button>
          )}
        </div>

        {/* Admin viewing banner */}
        {!isOwner && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-blue-800">စီမံခန့်ခွဲသူ ကြည့်ရှုမှု</p>
                <p className="text-xs text-blue-700 mt-1">
                  သင်သည် ဤခိုလှုံရာအိမ်၏ အချက်အလက်များကို ကြည့်ရှုနေပါသည်။ ပြင်ဆင်ခွင့် မရှိပါ။
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Limited access banner for pending */}
        {isPending && isOwner && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-amber-800">ကန့်သတ်ဝင်ရောက်ခွင့်</p>
                <p className="text-xs text-amber-700 mt-1">
                  သင့်ခိုလှုံရာအိမ်သည် စီမံခန့်ခွဲသူ အတည်ပြုရန် စောင့်ဆိုင်းနေပါသည်။ 
                  ပရိုဖိုင် အချက်အလက်များကို ပြင်ဆင်နိုင်သော်လည်း အခြားလုပ်ဆောင်ချက်များကို 
                  အတည်ပြုပြီးမှ ဝင်ရောက်နိုင်ပါမည်။
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Success / Error messages */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-green-800 font-medium">{success}</p>
          </div>
        )}
        {error && profile && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-red-800 font-medium">{error}</p>
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Profile Images Gallery */}
          {(allCurrentImages.length > 0 || editMode) && (
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700">ပရိုဖိုင် ဓာတ်ပုံများ</h3>
                {editMode && (profileImages.length + newImages.length) < 5 && (
                  <label className="text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer">
                    ပုံထည့်ရန်
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                      ref={imageInputRef}
                    />
                  </label>
                )}
              </div>
              {allCurrentImages.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {profileImages.map((img, idx) => (
                    <div key={`existing-${idx}`} className="relative group aspect-video rounded-lg overflow-hidden border border-gray-200">
                      <img src={img} alt={`ပရိုဖိုင် ${idx + 1}`} className="w-full h-full object-cover" />
                      {editMode && (
                        <button
                          onClick={() => removeExistingImage(idx)}
                          className="absolute top-1.5 right-1.5 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition"
                        >
                          &times;
                        </button>
                      )}
                    </div>
                  ))}
                  {newImages.map((img, idx) => (
                    <div key={`new-${idx}`} className="relative group aspect-video rounded-lg overflow-hidden border-2 border-dashed border-blue-300">
                      <img src={img.preview} alt={`ပုံအသစ် ${idx + 1}`} className="w-full h-full object-cover" />
                      {editMode && (
                        <button
                          onClick={() => removeNewImage(idx)}
                          className="absolute top-1.5 right-1.5 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition"
                        >
                          &times;
                        </button>
                      )}
                      <span className="absolute bottom-1.5 left-1.5 bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded">
                        အသစ်
                      </span>
                    </div>
                  ))}
                </div>
              ) : editMode ? (
                <label className="block border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    ref={imageInputRef}
                  />
                  <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm text-gray-500">ခိုလှုံရာအိမ် ဓာတ်ပုံများ တင်ရန် နှိပ်ပါ</p>
                  <p className="text-xs text-gray-400 mt-1">အများဆုံး ၅ ပုံ (PNG, JPG - 5MB ထိ)</p>
                </label>
              ) : null}
            </div>
          )}

          {/* Info Section */}
          <div className="p-6 space-y-5">
            {/* Basic Info */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">အခြေခံ အချက်အလက်များ</h3>
              {editMode ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      ခိုလှုံရာအိမ် အမည်
                    </label>
                    <input
                      name="hostelName"
                      type="text"
                      value={formData.hostelName}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      အီးမေးလ်
                    </label>
                    <input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      လိပ်စာအပြည့်အစုံ
                    </label>
                    <input
                      name="address"
                      type="text"
                      value={formData.address}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        မြို့
                      </label>
                      <input
                        name="city"
                        type="text"
                        value={formData.city}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        ဖုန်းနံပါတ်
                      </label>
                      <input
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InfoField label="ခိုလှုံရာအိမ် အမည်" value={profile?.hostelName} />
                  <InfoField label="အီးမေးလ်" value={profile?.email} />
                  <InfoField label="လိပ်စာ" value={`${profile?.address}, ${profile?.city}`} />
                  <InfoField label="ဖုန်းနံပါတ်" value={profile?.phone} />
                </div>
              )}
            </div>

            {/* Population */}
            <div className="border-t border-gray-100 pt-5">
              <h3 className="text-sm font-medium text-gray-700 mb-3">လူဦးရေ အချက်အလက်</h3>
              {editMode ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      အရွယ်ရောက်ပြီးသူ အရေအတွက်
                    </label>
                    <input
                      name="adults"
                      type="number"
                      min="0"
                      value={formData.adults}
                      onChange={handleNumberChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      ကလေး အရေအတွက်
                    </label>
                    <input
                      name="children"
                      type="number"
                      min="0"
                      value={formData.children}
                      onChange={handleNumberChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-blue-700">{profile?.population?.adults || 0}</p>
                    <p className="text-xs text-blue-600 mt-1">အရွယ်ရောက်ပြီးသူ</p>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-purple-700">{profile?.population?.children || 0}</p>
                    <p className="text-xs text-purple-600 mt-1">ကလေး</p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons - Only for owner */}
            {isOwner && (
              <div className="border-t border-gray-100 pt-5">
                {editMode ? (
                  <div className="flex gap-3">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white py-2.5 rounded-lg text-sm font-semibold transition"
                    >
                      {saving ? "သိမ်းဆည်းနေသည်..." : "သိမ်းဆည်းရန်"}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={saving}
                      className="flex-1 bg-white hover:bg-gray-50 disabled:bg-gray-100 text-gray-700 py-2.5 rounded-lg text-sm font-semibold transition border border-gray-300"
                    >
                      ပယ်ဖျက်ရန်
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditMode(true)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-semibold transition"
                  >
                    ပရိုဖိုင် ပြင်ဆင်ရန်
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoField({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-400 font-medium">{label}</p>
      <p className="text-sm text-gray-900 mt-0.5">{value || "မရှိ"}</p>
    </div>
  );
}
