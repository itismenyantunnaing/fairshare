"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { uploadImageToCloudinary } from "@/lib/uploadClient";

const KPAY_PHONE = process.env.NEXT_PUBLIC_KPAY_PHONE || "09967777577";
const KPAY_QR_URL = "/kpay_qr.jpg";
const WAVE_PHONE = process.env.NEXT_PUBLIC_WAVE_PHONE || "09967777577";
const WAVE_QR_URL = "/wave_qr.jpg";

const CATEGORIES = [
  { key: "money", label: "ငွေကြေး", icon: "💰" },
  { key: "medical", label: "ဆေးဝါး", icon: "💊" },
  { key: "clothing", label: "အဝတ်အစား", icon: "👕" },
  { key: "food", label: "အစားအစာ", icon: "🍚" },
];

const MEDICAL_OPTIONS = [
  { type: "medical_pack", label: "ဆေးသေတ္တာ" },
  { type: "bandages", label: "ပတ်တီး" },
];

const CLOTHING_OPTIONS = [
  { type: "shirt_child", label: "ကလေး အင်္ကျီ" },
  { type: "shirt_adult", label: "လူကြီး အင်္ကျီ" },
  { type: "pants_child", label: "ကလေး ဘောင်းဘီ" },
  { type: "pants_adult", label: "လူကြီး ဘောင်းဘီ" },
];

export default function DonatePage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);
  const [category, setCategory] = useState("money");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [formData, setFormData] = useState({ amount: "", name: "", email: "", message: "", paymentMethod: "" });
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef(null);

  const initMedical = () => MEDICAL_OPTIONS.reduce((acc, o) => ({ ...acc, [o.type]: "" }), { other_label: "", other_qty: "" });
  const initClothing = () => CLOTHING_OPTIONS.reduce((acc, o) => ({ ...acc, [o.type]: "" }), { other_label: "", other_qty: "" });
  const initFood = () => ({ riceOption: null, riceQuantity: "1", riceCustomPyi: "", oilBottleQty: "", otherFood: [{ label: "", qty: "" }] });
  const [medicalQty, setMedicalQty] = useState(initMedical);
  const [clothingQty, setClothingQty] = useState(initClothing);
  const [foodState, setFoodState] = useState(initFood);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.success && data.user) {
          setUser(data.user);
          if (["shelter", "admin", "super_admin"].includes(data.user.role)) {
            router.replace("/shelters");
            return;
          }
          if (data.user.role === "donor") {
            setFormData(prev => ({ ...prev, name: data.user.name || "", email: data.user.email || "" }));
          }
        }
        setAuthChecked(true);
      } catch {
        setAuthChecked(true);
      }
    };
    check();
  }, [router]);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const switchCategory = (cat) => {
    setCategory(cat);
    setStep(1);
    setError(null);
    setFormData(prev => ({ ...prev, amount: "", paymentMethod: "" }));
    setScreenshotFile(null);
    setScreenshotPreview(null);
    setMedicalQty(initMedical());
    setClothingQty(initClothing());
    setFoodState(initFood());
  };

  const handleScreenshotChange = e => {
    const file = e.target.files?.[0];
    if (file) { setScreenshotFile(file); setScreenshotPreview(URL.createObjectURL(file)); }
  };

  const copyPhone = async () => {
    const phone = formData.paymentMethod === "kpay" ? KPAY_PHONE : WAVE_PHONE;
    try { await navigator.clipboard.writeText(phone); } catch {
      const el = document.createElement("textarea"); el.value = phone; document.body.appendChild(el); el.select(); document.execCommand("copy"); document.body.removeChild(el);
    }
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const downloadQR = () => {
    const url = formData.paymentMethod === "kpay" ? KPAY_QR_URL : WAVE_QR_URL;
    const name = formData.paymentMethod === "kpay" ? "kpay_qr.jpg" : "wave_qr.jpg";
    const a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const validateCommon = () => {
    if (!formData.name.trim() || !formData.email.trim()) { setError("အမည်နှင့် အီးမေးလ် ထည့်သွင်းပါ။"); return false; }
    setError(null); return true;
  };

  const handleMoneyStep1 = e => {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) { setError("ပမာဏ ထည့်သွင်းပါ။"); return; }
    if (!formData.paymentMethod) { setError("ငွေပေးချေနည်း ရွေးပါ။"); return; }
    if (!validateCommon()) return;
    setStep(2);
  };

  const handleMoneySubmit = async e => {
    e.preventDefault();
    if (!screenshotFile) { setError("ငွေလွှဲပုံ ဓာတ်ပုံ တင်ပါ။"); return; }
    setLoading(true); setError(null);
    try {
      const uploadResult = await uploadImageToCloudinary(screenshotFile, "donations/screenshots");
      if (uploadResult.error) { setError(uploadResult.error); setLoading(false); return; }
      const res = await fetch("/api/donations", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ donorId: user?.role === "donor" ? user.id : null, category: "money", amount: Number(formData.amount), paymentMethod: formData.paymentMethod, name: formData.name.trim(), email: formData.email.trim(), message: formData.message.trim() || null, transactionScreenshot: uploadResult.url }),
      });
      const data = await res.json();
      if (data.success) { resetForm(); setSuccess(data.message); } else { setError(data.error); }
    } catch { setError("အလှူ တင်၍ မရပါ။ ထပ်မံကြိုးစားပါ။"); } finally { setLoading(false); }
  };

  const handleItemSubmit = async (e, cat) => {
    e.preventDefault();
    if (!validateCommon()) return;
    const isM = cat === "medical";
    const opts = isM ? MEDICAL_OPTIONS : CLOTHING_OPTIONS;
    const qty = isM ? medicalQty : clothingQty;
    const items = [];
    for (const o of opts) {
      const q = parseInt(qty[o.type], 10);
      if (q > 0) items.push({ type: o.type, quantity: q });
    }
    const otherQ = parseInt(qty.other_qty, 10);
    if (otherQ > 0 && qty.other_label.trim()) items.push({ type: "other", label: qty.other_label.trim(), quantity: otherQ });
    if (items.length === 0) { setError(isM ? "ဆေးဝါး ပစ္စည်း အနည်းဆုံး တစ်ခု ပမာဏ ထည့်ပါ။" : "အဝတ်အစား အနည်းဆုံး တစ်ခု ပမာဏ ထည့်ပါ။"); return; }
    setLoading(true); setError(null);
    try {
      const body = { donorId: user?.role === "donor" ? user.id : null, category: cat, name: formData.name.trim(), email: formData.email.trim(), message: formData.message.trim() || null };
      if (isM) body.medicalItems = items; else body.clothingItems = items;
      const res = await fetch("/api/donations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (data.success) { resetForm(); setSuccess(data.message); } else { setError(data.error); }
    } catch { setError("အလှူ တင်၍ မရပါ။ ထပ်မံကြိုးစားပါ။"); } finally { setLoading(false); }
  };

  const handleFoodSubmit = async (e) => {
    e.preventDefault();
    if (!validateCommon()) return;
    const hasRice = foodState.riceOption && ["one_bag", "half_bag", "custom_pyi"].includes(foodState.riceOption);
    if (hasRice && foodState.riceOption === "custom_pyi") {
      const n = Number(foodState.riceCustomPyi);
      if (!Number.isFinite(n) || n <= 0) { setError("ပြည် ပမာဏ ထည့်ပါ။"); return; }
    }
    if (hasRice && (foodState.riceOption === "one_bag" || foodState.riceOption === "half_bag")) {
      const q = parseInt(foodState.riceQuantity, 10);
      if (!Number.isFinite(q) || q < 1) { setError("ပမာဏ အနည်းဆုံး ၁ ထည့်ပါ။"); return; }
    }
    const foodItems = [];
    const oilQ = parseInt(foodState.oilBottleQty, 10);
    if (Number.isFinite(oilQ) && oilQ > 0) foodItems.push({ type: "oil_bottle", quantity: oilQ });
    for (const row of foodState.otherFood) {
      const q = parseInt(row.qty, 10);
      if (Number.isFinite(q) && q > 0 && row.label.trim()) foodItems.push({ type: "other", label: row.label.trim(), quantity: q });
    }
    if (!hasRice && foodItems.length === 0) { setError("ဆန် သို့မဟုတ် အခြား အစားအစာ အနည်းဆုံး တစ်ခု ရွေးပါ။"); return; }
    setLoading(true); setError(null);
    try {
      const body = {
        donorId: user?.role === "donor" ? user.id : null,
        category: "food",
        name: formData.name.trim(),
        email: formData.email.trim(),
        message: formData.message.trim() || null,
      };
      if (hasRice) {
        if (foodState.riceOption === "custom_pyi") {
          body.rice = { option: "custom_pyi", customPyi: Number(foodState.riceCustomPyi) };
        } else {
          body.rice = { option: foodState.riceOption, quantity: parseInt(foodState.riceQuantity, 10) || 1 };
        }
      }
      body.foodItems = foodItems;
      const res = await fetch("/api/donations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (data.success) { resetForm(); setSuccess(data.message); } else { setError(data.error); }
    } catch { setError("အလှူ တင်၍ မရပါ။ ထပ်မံကြိုးစားပါ။"); } finally { setLoading(false); }
  };

  const resetForm = () => {
    setStep(1);
    setFormData(prev => ({ amount: "", name: user?.role === "donor" ? prev.name : "", email: user?.role === "donor" ? prev.email : "", message: "", paymentMethod: "" }));
    setScreenshotFile(null); setScreenshotPreview(null);
    setMedicalQty(initMedical()); setClothingQty(initClothing());
    setFoodState(initFood());
  };

  if (!authChecked) {
    return (<div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center"><div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full" /></div>);
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">လှူဒါန်းရန်</h1>

        {success && <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6"><p className="text-sm text-green-800 font-medium">{success}</p></div>}
        {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6"><p className="text-sm text-red-800 font-medium">{error}</p></div>}

        {/* Category selector */}
        <div className="flex gap-2 mb-6">
          {CATEGORIES.map(c => (
            <button key={c.key} type="button" onClick={() => switchCategory(c.key)}
              className={`flex-1 py-3 px-2 rounded-xl text-sm font-semibold border-2 transition ${category === c.key ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"}`}>
              <span className="block text-lg mb-1">{c.icon}</span>{c.label}
            </button>
          ))}
        </div>

        {/* Common fields (only step 1 for money, always for others) */}
        {(category !== "money" || step === 1) && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">အမည် <span className="text-red-500">*</span></label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="သင့်အမည်" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">အီးမေးလ် <span className="text-red-500">*</span></label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="donor@example.com" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">မှတ်ချက် (မထည့်လည်းရပါသည်)</label>
              <textarea name="message" value={formData.message} onChange={handleChange} rows={2} placeholder="မှတ်ချက်" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none" />
            </div>

            {/* Money-specific step 1 fields */}
            {category === "money" && (
              <form onSubmit={handleMoneyStep1} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ပမာဏ (MMK) <span className="text-red-500">*</span></label>
                  <input type="number" name="amount" min="1" value={formData.amount} onChange={handleChange} placeholder="ဥပမာ - 10000" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ငွေပေးချေနည်း <span className="text-red-500">*</span></label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="paymentMethod" value="kpay" checked={formData.paymentMethod === "kpay"} onChange={handleChange} className="text-blue-600" /><span>KPay</span></label>
                    <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="paymentMethod" value="wave" checked={formData.paymentMethod === "wave"} onChange={handleChange} className="text-blue-600" /><span>Wave</span></label>
                  </div>
                </div>
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition">နောက်တစ်ဆင့်သို့</button>
              </form>
            )}

            {/* Medical items */}
            {category === "medical" && (
              <form onSubmit={e => handleItemSubmit(e, "medical")} className="space-y-4">
                <p className="text-sm font-medium text-gray-700">ဆေးဝါး ပစ္စည်းများ ရွေးပါ <span className="text-red-500">*</span></p>
                {MEDICAL_OPTIONS.map(o => (
                  <div key={o.type} className="flex items-center gap-3">
                    <span className="text-sm text-gray-700 w-32">{o.label}</span>
                    <input type="number" min="0" placeholder="ပမာဏ" value={medicalQty[o.type]} onChange={e => setMedicalQty(prev => ({ ...prev, [o.type]: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                ))}
                <div className="border-t border-gray-100 pt-3">
                  <p className="text-xs text-gray-500 mb-2">အခြား (စိတ်ကြိုက်)</p>
                  <div className="flex items-center gap-3">
                    <input type="text" placeholder="ပစ္စည်း အမည်" value={medicalQty.other_label} onChange={e => setMedicalQty(prev => ({ ...prev, other_label: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                    <input type="number" min="0" placeholder="ပမာဏ" value={medicalQty.other_qty} onChange={e => setMedicalQty(prev => ({ ...prev, other_qty: e.target.value }))}
                      className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>
                <button type="submit" disabled={loading} className={`w-full py-3 rounded-lg font-semibold text-white transition ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}>
                  {loading ? "တင်နေသည်..." : "ဆေးဝါး လှူဒါန်းရန်"}
                </button>
              </form>
            )}

            {/* Clothing items */}
            {category === "clothing" && (
              <form onSubmit={e => handleItemSubmit(e, "clothing")} className="space-y-4">
                <p className="text-sm font-medium text-gray-700">အဝတ်အစား ပစ္စည်းများ ရွေးပါ <span className="text-red-500">*</span></p>
                {CLOTHING_OPTIONS.map(o => (
                  <div key={o.type} className="flex items-center gap-3">
                    <span className="text-sm text-gray-700 w-40">{o.label}</span>
                    <input type="number" min="0" placeholder="ပမာဏ" value={clothingQty[o.type]} onChange={e => setClothingQty(prev => ({ ...prev, [o.type]: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                ))}
                <div className="border-t border-gray-100 pt-3">
                  <p className="text-xs text-gray-500 mb-2">အခြား (စိတ်ကြိုက်)</p>
                  <div className="flex items-center gap-3">
                    <input type="text" placeholder="ပစ္စည်း အမည်" value={clothingQty.other_label} onChange={e => setClothingQty(prev => ({ ...prev, other_label: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                    <input type="number" min="0" placeholder="ပမာဏ" value={clothingQty.other_qty} onChange={e => setClothingQty(prev => ({ ...prev, other_qty: e.target.value }))}
                      className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>
                <button type="submit" disabled={loading} className={`w-full py-3 rounded-lg font-semibold text-white transition ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}>
                  {loading ? "တင်နေသည်..." : "အဝတ်အစား လှူဒါန်းရန်"}
                </button>
              </form>
            )}

            {/* Food: rice (one of three) + oil + other */}
            {category === "food" && (
              <form onSubmit={handleFoodSubmit} className="space-y-4">
                <p className="text-sm font-medium text-gray-700">ဆန် (တစ်ခုသာ ရွေးပါ) <span className="text-red-500">*</span></p>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer flex-wrap">
                    <input type="radio" name="riceOption" value="one_bag" checked={foodState.riceOption === "one_bag"} onChange={() => setFoodState(prev => ({ ...prev, riceOption: "one_bag", riceCustomPyi: "" }))} className="text-blue-600" />
                    <span className="text-sm text-gray-700">တအိတ် (၅၀ kg / ၂၄ ပြည်)</span>
                    {foodState.riceOption === "one_bag" && (
                      <input type="number" min="1" placeholder="အရေအတွက်" value={foodState.riceQuantity} onChange={e => setFoodState(prev => ({ ...prev, riceQuantity: e.target.value }))}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-gray-900 text-sm" />
                    )}
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer flex-wrap">
                    <input type="radio" name="riceOption" value="half_bag" checked={foodState.riceOption === "half_bag"} onChange={() => setFoodState(prev => ({ ...prev, riceOption: "half_bag", riceCustomPyi: "" }))} className="text-blue-600" />
                    <span className="text-sm text-gray-700">တအိတ် ခွဲ (၂၅ kg / ၁၂ ပြည်)</span>
                    {foodState.riceOption === "half_bag" && (
                      <input type="number" min="1" placeholder="အရေအတွက်" value={foodState.riceQuantity} onChange={e => setFoodState(prev => ({ ...prev, riceQuantity: e.target.value }))}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-gray-900 text-sm" />
                    )}
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="riceOption" value="custom_pyi" checked={foodState.riceOption === "custom_pyi"} onChange={() => setFoodState(prev => ({ ...prev, riceOption: "custom_pyi" }))} className="text-blue-600" />
                    <span className="text-sm text-gray-700">စိတ်ကြိုက် ပြည်</span>
                    {foodState.riceOption === "custom_pyi" && (
                      <input type="number" min="1" placeholder="ပြည်" value={foodState.riceCustomPyi} onChange={e => setFoodState(prev => ({ ...prev, riceCustomPyi: e.target.value }))}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-gray-900 text-sm" />
                    )}
                  </label>
                </div>

                <div className="border-t border-gray-100 pt-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">အခြား အစားအစာ</p>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-sm text-gray-700 w-28">ဆီပုလင်း</span>
                    <input type="number" min="0" placeholder="ပမာဏ" value={foodState.oilBottleQty} onChange={e => setFoodState(prev => ({ ...prev, oilBottleQty: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <p className="text-xs text-gray-500 mb-2">အခြား (စိတ်ကြိုက်) — ပစ္စည်းအမည် + ပမာဏ</p>
                  {foodState.otherFood.map((row, i) => (
                    <div key={i} className="flex items-center gap-2 mb-2">
                      <input type="text" placeholder="အမည်" value={row.label} onChange={e => setFoodState(prev => ({ ...prev, otherFood: prev.otherFood.map((r, j) => j === i ? { ...r, label: e.target.value } : r) }))}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm" />
                      <input type="number" min="0" placeholder="ပမာဏ" value={row.qty} onChange={e => setFoodState(prev => ({ ...prev, otherFood: prev.otherFood.map((r, j) => j === i ? { ...r, qty: e.target.value } : r) }))}
                        className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm" />
                      {foodState.otherFood.length > 1 && (
                        <button type="button" onClick={() => setFoodState(prev => ({ ...prev, otherFood: prev.otherFood.filter((_, j) => j !== i) }))} className="text-red-500 hover:text-red-700 text-sm">ဖျက်</button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={() => setFoodState(prev => ({ ...prev, otherFood: [...prev.otherFood, { label: "", qty: "" }] }))} className="text-sm text-blue-600 hover:text-blue-800">+ အခြား ထပ်ထည့်ရန်</button>
                </div>

                <button type="submit" disabled={loading} className={`w-full py-3 rounded-lg font-semibold text-white transition ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}>
                  {loading ? "တင်နေသည်..." : "အစားအစာ လှူဒါန်းရန်"}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Money step 2: QR + screenshot */}
        {category === "money" && step === 2 && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">{formData.paymentMethod === "kpay" ? "KPay" : "Wave"} ဖြင့် ငွေလွှဲပါ</h2>
              <button type="button" onClick={() => setStep(1)} className="text-sm text-gray-500 hover:text-gray-700">ပြန်ပြင်ရန်</button>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-sm text-gray-500 mb-1">ဖုန်းနံပါတ်</p>
              <div className="flex items-center justify-center gap-2">
                <p className="text-lg font-mono font-semibold text-gray-900">{formData.paymentMethod === "kpay" ? KPAY_PHONE : WAVE_PHONE}</p>
                <button type="button" onClick={copyPhone} className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md border border-gray-300 bg-white hover:bg-gray-100 text-gray-600 transition" title="နံပါတ် ကူးယူရန်">
                  {copied ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-green-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" /><path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" /></svg>
                  )}
                  {copied ? "ကူးပြီး" : "ကူးယူ"}
                </button>
              </div>
            </div>

            {(formData.paymentMethod === "kpay" ? KPAY_QR_URL : WAVE_QR_URL) && (
              <div className="flex flex-col items-center gap-2">
                <img src={formData.paymentMethod === "kpay" ? KPAY_QR_URL : WAVE_QR_URL} alt="QR Code" className="w-48 h-48 object-contain border border-gray-200 rounded-lg" />
                <button type="button" onClick={downloadQR} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 transition">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                  QR ဒေါင်းလုဒ်
                </button>
              </div>
            )}

            <p className="text-sm text-gray-500">ငွေလွှဲပြီးသည့်နောက် အောက်ပါ ဓာတ်ပုံ နေရာတွင် ငွေလွှဲပုံ ဓာတ်ပုံ တင်ပါ။</p>

            <form onSubmit={handleMoneySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ငွေလွှဲပုံ ဓာတ်ပုံ <span className="text-red-500">*</span></label>
                {screenshotPreview ? (
                  <div className="relative inline-block">
                    <img src={screenshotPreview} alt="Screenshot" className="max-h-48 rounded-lg border border-gray-200" />
                    <button type="button" onClick={() => { setScreenshotFile(null); setScreenshotPreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }} className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">×</button>
                  </div>
                ) : (
                  <label className="block border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition cursor-pointer">
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleScreenshotChange} className="hidden" />
                    <svg className="w-10 h-10 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <p className="text-sm text-gray-500">ဓာတ်ပုံ ရွေးရန် နှိပ်ပါ</p>
                  </label>
                )}
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)} className="flex-1 bg-white hover:bg-gray-50 text-gray-700 py-3 rounded-lg font-semibold border border-gray-300 transition">နောက်ပြန်သွားရန်</button>
                <button type="submit" disabled={loading || !screenshotFile} className={`flex-1 py-3 rounded-lg font-semibold text-white transition ${loading || !screenshotFile ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}>{loading ? "တင်နေသည်..." : "အလှူ တင်ရန်"}</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
