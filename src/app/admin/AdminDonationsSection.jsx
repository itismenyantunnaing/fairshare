"use client";
import { useState, useEffect, useRef } from "react";
import { uploadImageToCloudinary } from "@/lib/uploadClient";
import { useToast } from "@/context/ToastContext";

const TABS = [
  { key: "pending", label: "စိစစ်ရန်" },
  { key: "approved", label: "အတည်ပြုပြီး" },
  { key: "rejected", label: "ငြင်းပယ်ပြီး" },
];

const CATEGORY_LABEL = { money: "ငွေကြေး", medical: "ဆေးဝါး", clothing: "အဝတ်အစား", food: "အစားအစာ" };
const CATEGORY_ICON = { money: "💰", medical: "💊", clothing: "👕", food: "🍚" };

const RICE_LABEL = { one_bag: "တအိတ် (၂၄ ပြည်)", half_bag: "တအိတ် ခွဲ (၁၂ ပြည်)", custom_pyi: "စိတ်ကြိုက် ပြည်" };
const ITEM_LABEL = {
  medical_pack: "ဆေးသေတ္တာ",
  bandages: "ပတ်တီး",
  shirt_child: "ကလေး အင်္ကျီ",
  shirt_adult: "လူကြီး အင်္ကျီ",
  pants_child: "ကလေး ဘောင်းဘီ",
  pants_adult: "လူကြီး ဘောင်းဘီ",
  oil_bottle: "ဆီပုလင်း",
  other: "အခြား",
};

function donationSummary(d) {
  const cat = d.category || "money";
  if (cat === "money") return `${Number(d.amount).toLocaleString()} MMK · ${d.paymentMethod === "kpay" ? "KPay" : "Wave"}`;
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

export default function AdminDonationsSection({ donationsPending = 0, donationsApproved = 0, onCountsChange }) {
  const { showToast } = useToast();
  const [donations, setDonations] = useState([]);
  const [totalFoodPyi, setTotalFoodPyi] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectNote, setRejectNote] = useState("");
  const [certificateFile, setCertificateFile] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [donationPage, setDonationPage] = useState(1);
  const certInputRef = useRef(null);

  const PER_PAGE = 12;

  const fetchDonations = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/donations?status=${activeTab}`);
      const data = await res.json();
      if (data.success) {
        setDonations(data.donations);
        setTotalFoodPyi(data.totalFoodPyi ?? 0);
        onCountsChange?.();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, [activeTab]);

  useEffect(() => {
    setDonationPage(1);
  }, [searchQuery]);

  const approveDonation = async (donation, certificateUrl = null, fromDetail = false) => {
    if (!donation?.id) return;
    setActionLoading(fromDetail ? "approve" : donation.id);
    try {
      const res = await fetch(`/api/admin/donations/${donation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve", certificateUrl: certificateUrl || null }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, "success");
        if (selectedDonation?.id === donation.id) setSelectedDonation(null);
        setCertificateFile(null);
        fetchDonations();
      } else showToast(data.error || "အတည်ပြု၍ မရပါ", "error");
    } catch { showToast("ကွန်ရက်ချို့ယွင်းချက်။ ထပ်မံကြိုးစားပါ။", "error"); }
    finally { setActionLoading(null); }
  };

  const handleApprove = async () => {
    if (!selectedDonation) return;
    if (!certificateFile) {
      showToast("အတည်ပြုရန် လက်မှတ် ဓာတ်ပုံ ထည့်သွင်းရပါမည်။", "error");
      return;
    }
    const uploadResult = await uploadImageToCloudinary(certificateFile, "donations/certificates");
    if (uploadResult.error) { showToast(uploadResult.error, "error"); return; }
    await approveDonation(selectedDonation, uploadResult.url, true);
  };

  const handleReject = async () => {
    if (!selectedDonation) return;
    setActionLoading("reject");
    try {
      const res = await fetch(`/api/admin/donations/${selectedDonation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", note: rejectNote }),
      });
      const data = await res.json();
      if (data.success) { showToast(data.message, "success"); setSelectedDonation(null); setRejectNote(""); fetchDonations(); }
      else showToast(data.error || "ငြင်းပယ်၍ မရပါ", "error");
    } catch { showToast("ကွန်ရက်ချို့ယွင်းချက်။ ထပ်မံကြိုးစားပါ။", "error"); }
    finally { setActionLoading(null); }
  };

  const handleDelete = async (id) => {
    if (!confirm("ဤအလှူကို အပြီးတိုင် ဖျက်ပစ်လိုသည်မှာ သေချာပါသလား?")) return;
    try {
      const res = await fetch(`/api/admin/donations/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) { showToast("အလှူ ဖျက်ပြီးပါပြီ။", "success"); setSelectedDonation(null); fetchDonations(); }
      else showToast(data.error || "ဖျက်၍ မရပါ", "error");
    } catch { showToast("ကွန်ရက်ချို့ယွင်းချက်။", "error"); }
  };

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString("my-MM", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "";

  const filteredDonations = donations.filter((d) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const name = (d.name || "").toLowerCase();
    const email = (d.email || "").toLowerCase();
    const summary = donationSummary(d).toLowerCase();
    const category = (CATEGORY_LABEL[d.category] || "").toLowerCase();
    return name.includes(q) || email.includes(q) || summary.includes(q) || category.includes(q);
  });

  const totalDonationPages = Math.max(1, Math.ceil(filteredDonations.length / PER_PAGE));
  const paginatedDonations = filteredDonations.slice((donationPage - 1) * PER_PAGE, donationPage * PER_PAGE);

  const sd = selectedDonation;
  const sdCat = sd?.category || "money";

  return (
    <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-sm text-gray-700">စုစုပေါင်း ပြည် (အစားအစာ အတည်ပြုပြီး): <span className="font-semibold text-gray-900">{totalFoodPyi.toLocaleString()} ပြည်</span></p>
        </div>

        <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => { setActiveTab(tab.key); setDonationPage(1); }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                  activeTab === tab.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="အလှူ / အမည် / အီးမေးလ် ရှာဖွေရန်..."
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-64"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-6 mb-6 text-sm text-gray-600">
          <span>စိစစ်ရန်: <strong className="text-amber-700">{donationsPending}</strong> အလှူ</span>
          <span>အတည်ပြုပြီး: <strong className="text-green-700">{donationsApproved}</strong> အလှူ</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full" /></div>
        ) : filteredDonations.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-500">
            {searchQuery
              ? `"${searchQuery}" အတွက် ရလဒ်မရှိပါ။`
              : "ဤအမျိုးအစားတွင် အလှူ မရှိသေးပါ။"}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedDonations.map((d) => {
                const cat = d.category || "money";
                return (
                  <div key={d.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:border-blue-200 transition">
                    <div className="flex justify-between items-start">
                      <div className="cursor-pointer flex-1 min-w-0" onClick={() => setSelectedDonation(d)}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-base">{CATEGORY_ICON[cat]}</span>
                          <span className="text-xs font-medium text-gray-500">{CATEGORY_LABEL[cat]}</span>
                        </div>
                        <p className="font-semibold text-gray-900 text-sm">{donationSummary(d)}</p>
                        <p className="text-sm text-gray-500 truncate">{d.name}</p>
                        <p className="text-xs text-gray-400">{d.email}</p>
                        <p className="text-xs text-gray-400 mt-1">{formatDate(d.createdAt)}</p>
                      </div>
                      <div className="flex flex-col gap-1 flex-shrink-0 ml-2">
                        {activeTab === "pending" && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedDonation(d); }}
                            className="text-green-600 hover:text-green-700 text-sm font-medium px-2 py-1 rounded bg-green-50 hover:bg-green-100"
                          >
                            အတည်ပြုရန် (အသေးစိတ်)
                          </button>
                        )}
                        {activeTab === "rejected" && (
                          <button onClick={(e) => { e.stopPropagation(); handleDelete(d.id); }} className="text-red-500 hover:text-red-700 text-sm font-medium">ဖျက်ရန်</button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {totalDonationPages > 1 && (
              <div className="flex items-center justify-between flex-wrap gap-3">
                <p className="text-sm text-gray-500">
                  စာမျက်နှာ {donationPage} / {totalDonationPages} (စုစုပေါင်း {filteredDonations.length} ခု)
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setDonationPage((p) => Math.max(1, p - 1))}
                    disabled={donationPage <= 1}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ရှေ့
                  </button>
                  <button
                    type="button"
                    onClick={() => setDonationPage((p) => Math.min(totalDonationPages, p + 1))}
                    disabled={donationPage >= totalDonationPages}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    နောက်
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Donation detail modal */}
        {sd && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
                onClick={() => { setSelectedDonation(null); setRejectNote(""); setCertificateFile(null); }}
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
                      <button type="button" onClick={() => { setSelectedDonation(null); setRejectNote(""); setCertificateFile(null); }} className="text-gray-400 hover:text-gray-600 text-2xl leading-none p-1" aria-label="ပိတ်ရန်">✕</button>
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
                  <p><span className="text-gray-500">နေ့စွဲ:</span> {formatDate(sd.createdAt)}</p>

                  {sd.transactionScreenshot && (
                  <div className="mt-4">
                    <p className="text-xs text-gray-500 mb-2">ငွေလွှဲပုံ</p>
                    <a href={sd.transactionScreenshot} target="_blank" rel="noopener noreferrer" className="block rounded-lg overflow-hidden border border-gray-200">
                      <img src={sd.transactionScreenshot} alt="Screenshot" className="w-full max-h-48 object-contain bg-gray-50" />
                    </a>
                  </div>
                )}

                {sd.status === "pending" && (
                  <div className="mt-6 space-y-4 border-t border-gray-100 pt-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">လက်မှတ် ဓာတ်ပုံ <span className="text-red-500">(အတည်ပြုရန် လိုအပ်ပါသည်)</span></label>
                      <input ref={certInputRef} type="file" accept="image/*" onChange={(e) => setCertificateFile(e.target.files?.[0] || null)}
                        className="block w-full text-sm text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">ငြင်းပယ်ရသည့် အကြောင်းရင်း (မထည့်လည်းရပါသည်)</label>
                      <textarea value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} rows={2} placeholder="ငြင်းပယ်ချက်..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={handleApprove} disabled={actionLoading !== null || !certificateFile}
                        className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white py-2 rounded-lg text-sm font-semibold transition"
                        title={!certificateFile ? "လက်မှတ် ဓာတ်ပုံ ထည့်ပါ" : undefined}>
                        {actionLoading === "approve" ? "လုပ်နေသည်..." : "အတည်ပြုရန်"}
                      </button>
                      <button type="button" onClick={handleReject} disabled={actionLoading !== null}
                        className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white py-2 rounded-lg text-sm font-semibold transition">
                        {actionLoading === "reject" ? "လုပ်နေသည်..." : "ငြင်းပယ်ရန်"}
                      </button>
                    </div>
                  </div>
                  )}
                </div>
              </div>
            </div>
        )}
      </div>
    </div>
  );
}
