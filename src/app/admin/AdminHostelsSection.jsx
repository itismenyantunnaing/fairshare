"use client";
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/context/ToastContext";

const STATUS_TABS = [
  { key: "pending", label: "စိစစ်ရန်" },
  { key: "approved", label: "အတည်ပြုပြီး" },
  { key: "auto_rejected", label: "အလိုအလျောက် ငြင်းပယ်" },
  { key: "rejected", label: "ငြင်းပယ်ပြီး" },
];

const STATUS_COLORS = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  approved: "bg-green-100 text-green-800 border-green-200",
  auto_rejected: "bg-orange-100 text-orange-800 border-orange-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
};

const STATUS_LABELS = {
  pending: "စိစစ်ရန်",
  approved: "အတည်ပြုပြီး",
  auto_rejected: "အလိုအလျောက် ငြင်းပယ်",
  rejected: "ငြင်းပယ်ပြီး",
};

export default function AdminHostelsSection({ hostelsPending = 0, hostelsApproved = 0, hostelsAutoRejected = 0, onCountsChange }) {
  const { showToast } = useToast();
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedHostel, setSelectedHostel] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [reviewNote, setReviewNote] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [hostelPage, setHostelPage] = useState(1);

  const PER_PAGE = 12;

  const fetchHostels = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/hostels?status=${activeTab}`);
      const data = await res.json();
      if (data.success) {
        setHostels(data.hostels);
        onCountsChange?.();
      }
    } catch (error) {
      console.error("Error fetching hostels:", error);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchHostels();
  }, [fetchHostels]);

  useEffect(() => {
    setHostelPage(1);
  }, [searchQuery]);

  const viewDetails = async (id) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/hostels/${id}`);
      const data = await res.json();
      if (data.success) {
        setSelectedHostel(data.hostel);
      }
    } catch (error) {
      console.error("Error fetching hostel details:", error);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleAction = async (id, action) => {
    setActionLoading(action);
    try {
      const res = await fetch(`/api/hostels/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note: reviewNote }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, "success");
        setSelectedHostel(null);
        setReviewNote("");
        fetchHostels();
      } else {
        showToast(data.error || "လုပ်ဆောင်ချက် မအောင်မြင်ပါ", "error");
      }
    } catch (error) {
      console.error("Error performing action:", error);
      showToast("ကွန်ရက်ချို့ယွင်းချက်။ ထပ်မံကြိုးစားပါ။", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("ဤဂေဟာကို အပြီးတိုင် ဖျက်ပစ်လိုသည်မှာ သေချာပါသလား?")) {
      return;
    }
    setActionLoading("delete");
    try {
      const res = await fetch(`/api/hostels/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, "success");
        setSelectedHostel(null);
        fetchHostels();
      } else {
        showToast(data.error || "ဖျက်ခြင်း မအောင်မြင်ပါ", "error");
      }
    } catch (error) {
      console.error("Error deleting hostel:", error);
      showToast("ကွန်ရက်ချို့ယွင်းချက်။ ထပ်မံကြိုးစားပါ။", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "မရှိ";
    return new Date(dateStr).toLocaleDateString("my-MM", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredHostels = hostels.filter((hostel) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      hostel.hostelName?.toLowerCase().includes(query) ||
      hostel.email?.toLowerCase().includes(query) ||
      hostel.address?.toLowerCase().includes(query) ||
      hostel.city?.toLowerCase().includes(query) ||
      hostel.phone?.includes(query)
    );
  });

  const totalHostelPages = Math.max(1, Math.ceil(filteredHostels.length / PER_PAGE));
  const paginatedHostels = filteredHostels.slice((hostelPage - 1) * PER_PAGE, hostelPage * PER_PAGE);

  return (
    <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  setSelectedHostel(null);
                  setHostelPage(1);
                }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                  activeTab === tab.key
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
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
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ဂေဟာ ရှာဖွေရန်..."
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-64"
            />
            {searchQuery && (
              <button
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
        <div className="flex items-center gap-6 mb-6 text-sm text-gray-600 flex-wrap">
          <span>စိစစ်ရန်: <strong className="text-amber-700">{hostelsPending}</strong> ဂေဟာ</span>
          <span>အတည်ပြုပြီး: <strong className="text-green-700">{hostelsApproved}</strong> ဂေဟာ</span>
          <span>AI ငြင်းပယ်: <strong className="text-orange-700">{hostelsAutoRejected}</strong> ဂေဟာ</span>
        </div>

        <div className="flex gap-6">
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
                <p className="text-gray-500 text-sm">ဂေဟာများ ခေါ်ယူနေသည်...</p>
              </div>
            ) : filteredHostels.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                {searchQuery ? (
                  <p className="text-gray-400 text-sm">
                    &quot;{searchQuery}&quot; အတွက် {STATUS_LABELS[activeTab]} တွင် ရလဒ်မရှိပါ
                  </p>
                ) : (
                  <p className="text-gray-400 text-sm">
                    &quot;{STATUS_LABELS[activeTab]}&quot; အခြေအနေရှိ ဂေဟာ မရှိပါ
                  </p>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {paginatedHostels.map((hostel) => (
                    <div
                      key={hostel._id}
                      onClick={() => viewDetails(hostel._id)}
                      className={`bg-white rounded-xl border p-5 cursor-pointer transition hover:shadow-md ${
                        selectedHostel?._id === hostel._id
                          ? "border-blue-400 ring-2 ring-blue-100"
                          : "border-gray-200"
                      }`}
                    >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {hostel.hostelName}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {hostel.address}, {hostel.city}
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                          {hostel.email}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2 ml-4 flex-shrink-0">
                        <span
                          className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                            STATUS_COLORS[hostel.verification?.status] ||
                            "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {STATUS_LABELS[hostel.verification?.status] || "မသိ"}
                        </span>
                        {hostel.verification?.autoCheckPassed && (
                          <span className="text-xs text-green-600 font-medium">
                            AI အတည်ပြုပြီး
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <p className="text-xs text-gray-400">
                        တင်သွင်းသည့်ရက်: {formatDate(hostel.createdAt)}
                      </p>
                      {selectedHostel?._id !== hostel._id && (
                        <>
                          {activeTab === "pending" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAction(hostel._id, "approve");
                              }}
                              disabled={actionLoading !== null}
                              className="text-xs text-green-600 hover:text-green-800 font-medium px-2 py-1 rounded hover:bg-green-50 transition disabled:opacity-50"
                            >
                              အတည်ပြုရန်
                            </button>
                          )}
                          {activeTab === "auto_rejected" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAction(hostel._id, "reject");
                              }}
                              disabled={actionLoading !== null}
                              className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50 transition disabled:opacity-50"
                            >
                              ငြင်းပယ်ရန်
                            </button>
                          )}
                          {activeTab === "rejected" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(hostel._id);
                              }}
                              disabled={actionLoading !== null}
                              className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50 transition disabled:opacity-50"
                            >
                              ဖျက်ရန်
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  ))}
                </div>

                {totalHostelPages > 1 && (
                  <div className="mt-6 flex items-center justify-between flex-wrap gap-3">
                    <p className="text-sm text-gray-500">
                      စာမျက်နှာ {hostelPage} / {totalHostelPages} (စုစုပေါင်း {filteredHostels.length} ခု)
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setHostelPage((p) => Math.max(1, p - 1))}
                        disabled={hostelPage <= 1}
                        className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ရှေ့
                      </button>
                      <button
                        type="button"
                        onClick={() => setHostelPage((p) => Math.min(totalHostelPages, p + 1))}
                        disabled={hostelPage >= totalHostelPages}
                        className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        နောက်
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Hostel detail modal */}
          {selectedHostel && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
              onClick={() => setSelectedHostel(null)}
              role="dialog"
              aria-modal="true"
              aria-labelledby="hostel-detail-title"
            >
              <div
                className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                {detailLoading ? (
                  <div className="p-12 text-center">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
                  </div>
                ) : (
                  <>
                    <div className="p-5 border-b border-gray-100 flex-shrink-0">
                      <div className="flex items-start justify-between">
                        <h3 id="hostel-detail-title" className="font-semibold text-gray-900 text-lg">
                          {selectedHostel.hostelName}
                        </h3>
                        <button
                          type="button"
                          onClick={() => setSelectedHostel(null)}
                          className="text-gray-400 hover:text-gray-600 text-2xl leading-none p-1"
                          aria-label="ပိတ်ရန်"
                        >
                          &times;
                        </button>
                      </div>
                      <span
                        className={`inline-block mt-2 text-xs font-medium px-2.5 py-1 rounded-full border ${
                          STATUS_COLORS[selectedHostel.verification?.status] ||
                          "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {STATUS_LABELS[selectedHostel.verification?.status] || "မသိ"}
                      </span>
                    </div>

                    <div className="p-5 space-y-4 overflow-y-auto flex-1">
                      <div>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">လိပ်စာ</p>
                        <p className="text-sm text-gray-700 mt-0.5">
                          {selectedHostel.address}, {selectedHostel.city}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">အီးမေးလ်</p>
                        <p className="text-sm text-gray-700 mt-0.5">{selectedHostel.email || "မရှိ"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">ဖုန်းနံပါတ်</p>
                        <p className="text-sm text-gray-700 mt-0.5">{selectedHostel.phone}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">တင်သွင်းသည့်ရက်</p>
                        <p className="text-sm text-gray-700 mt-0.5">{formatDate(selectedHostel.createdAt)}</p>
                      </div>

                      {selectedHostel.licenseImageUrl && (
                        <div>
                          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">လက်မှတ် ပုံ</p>
                          <img
                            src={selectedHostel.licenseImageUrl}
                            alt="ဂေဟာ လက်မှတ်"
                            className="w-full rounded-lg border border-gray-200"
                          />
                        </div>
                      )}

                      {selectedHostel.verification?.visionAnalysis && (
                        <div>
                          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">AI ခွဲခြမ်းစိတ်ဖြာမှု</p>
                          <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-3">
                            <div className="flex justify-between items-center">
                              <span
                                className={`font-medium ${
                                  selectedHostel.verification.autoCheckPassed ? "text-green-600" : "text-red-600"
                                }`}
                              >
                                {selectedHostel.verification.autoCheckPassed ? "တရားဝင် ဖြစ်နိုင်သည်" : "အတည်မပြုနိုင်ပါ"}
                              </span>
                              <span className="text-xs text-gray-400">
                                အမှတ်: {selectedHostel.verification.visionAnalysis.score || 0}
                                {selectedHostel.verification.visionAnalysis.confidence
                                  ? ` | OCR: ${selectedHostel.verification.visionAnalysis.confidence}%`
                                  : ""}
                              </span>
                            </div>
                            {selectedHostel.verification.visionAnalysis.extractedFields && (
                              <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
                                <div className="flex justify-between px-3 py-2">
                                  <span className="text-gray-500 text-xs">မှတ်ပုံတင်နံပါတ်</span>
                                  <span className="text-gray-900 text-xs font-medium">
                                    {selectedHostel.verification.visionAnalysis.extractedFields.registrationNo || "မတွေ့ပါ"}
                                  </span>
                                </div>
                                <div className="flex justify-between px-3 py-2">
                                  <span className="text-gray-500 text-xs">ထုတ်ပေးသည့်ရက်</span>
                                  <span className="text-gray-900 text-xs font-medium">
                                    {selectedHostel.verification.visionAnalysis.extractedFields.issueDate || "မတွေ့ပါ"}
                                  </span>
                                </div>
                                <div className="flex justify-between px-3 py-2">
                                  <span className="text-gray-500 text-xs">သက်တမ်းကုန်ဆုံးရက်</span>
                                  <span className="text-gray-900 text-xs font-medium">
                                    {selectedHostel.verification.visionAnalysis.extractedFields.expiryDate || "မတွေ့ပါ"}
                                  </span>
                                </div>
                                <div className="flex justify-between px-3 py-2">
                                  <span className="text-gray-500 text-xs">ခွင့်ပြုသူ</span>
                                  <span className="text-gray-900 text-xs font-medium text-right max-w-[200px]">
                                    {selectedHostel.verification.visionAnalysis.extractedFields.authorizedBy || "မတွေ့ပါ"}
                                  </span>
                                </div>
                              </div>
                            )}
                            {selectedHostel.verification.visionAnalysis.details && (
                              <div className="space-y-2">
                                {selectedHostel.verification.visionAnalysis.details.primaryMatches?.length > 0 && (
                                  <div>
                                    <span className="text-gray-500 text-xs block mb-1">လက်မှတ် အဓိကစကားလုံးများ</span>
                                    <div className="flex flex-wrap gap-1">
                                      {selectedHostel.verification.visionAnalysis.details.primaryMatches.map((kw) => (
                                        <span key={kw} className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded">{kw}</span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {selectedHostel.verification.visionAnalysis.details.authorityMatches?.length > 0 && (
                                  <div>
                                    <span className="text-gray-500 text-xs block mb-1">အာဏာပိုင် အဓိကစကားလုံးများ</span>
                                    <div className="flex flex-wrap gap-1">
                                      {selectedHostel.verification.visionAnalysis.details.authorityMatches.map((kw) => (
                                        <span key={kw} className="bg-purple-50 text-purple-700 text-xs px-2 py-0.5 rounded">{kw}</span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {selectedHostel.verification.visionAnalysis.details.domainMatches?.length > 0 && (
                                  <div>
                                    <span className="text-gray-500 text-xs block mb-1">နယ်ပယ် အဓိကစကားလုံးများ</span>
                                    <div className="flex flex-wrap gap-1">
                                      {selectedHostel.verification.visionAnalysis.details.domainMatches.map((kw) => (
                                        <span key={kw} className="bg-green-50 text-green-700 text-xs px-2 py-0.5 rounded">{kw}</span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {selectedHostel.verification.visionAnalysis.details.documentMatches?.length > 0 && (
                                  <div>
                                    <span className="text-gray-500 text-xs block mb-1">စာရွက်စာတမ်း အဓိကစကားလုံးများ</span>
                                    <div className="flex flex-wrap gap-1">
                                      {selectedHostel.verification.visionAnalysis.details.documentMatches.map((kw) => (
                                        <span key={kw} className="bg-amber-50 text-amber-700 text-xs px-2 py-0.5 rounded">{kw}</span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                            {selectedHostel.verification.visionAnalysis.error && (
                              <div>
                                <span className="text-red-500 text-xs">အမှား: {selectedHostel.verification.visionAnalysis.error}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {selectedHostel.verification?.reviewedAt && (
                        <div>
                          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">စစ်ဆေးမှု အသေးစိတ်</p>
                          <p className="text-sm text-gray-700">စစ်ဆေးသည့်ရက်: {formatDate(selectedHostel.verification.reviewedAt)}</p>
                          {selectedHostel.verification.reviewedBy && (
                            <p className="text-sm text-gray-700 mt-1">
                              စစ်ဆေးသူ: {selectedHostel.verification.reviewedBy.name}{" "}
                              <span className="text-gray-400 text-xs">
                                ({selectedHostel.verification.reviewedBy.role === "super_admin" ? "Super Admin" : "Admin"})
                              </span>
                            </p>
                          )}
                          {selectedHostel.verification.reviewNote && (
                            <p className="text-sm text-gray-600 mt-1 italic">&quot;{selectedHostel.verification.reviewNote}&quot;</p>
                          )}
                        </div>
                      )}

                      {(selectedHostel.verification?.status === "pending" ||
                        selectedHostel.verification?.status === "auto_rejected") && (
                        <div className="border-t border-gray-100 pt-4">
                          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">စီမံခန့်ခွဲသူ လုပ်ဆောင်ချက်များ</p>
                          <textarea
                            value={reviewNote}
                            onChange={(e) => setReviewNote(e.target.value)}
                            placeholder="စစ်ဆေးမှု မှတ်ချက် ထည့်ရန် (ရွေးချယ်ခွင့်)..."
                            className="w-full p-3 border border-gray-300 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                            rows={2}
                          />
                          <div className="flex gap-3 mt-3">
                            <button
                              onClick={() => handleAction(selectedHostel._id, "approve")}
                              disabled={actionLoading !== null}
                              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white py-2.5 rounded-lg text-sm font-semibold transition"
                            >
                              {actionLoading === "approve" ? "အတည်ပြုနေသည်..." : "အတည်ပြုရန်"}
                            </button>
                            <button
                              onClick={() => handleAction(selectedHostel._id, "reject")}
                              disabled={actionLoading !== null}
                              className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white py-2.5 rounded-lg text-sm font-semibold transition"
                            >
                              {actionLoading === "reject" ? "ငြင်းပယ်နေသည်..." : "ငြင်းပယ်ရန်"}
                            </button>
                          </div>
                        </div>
                      )}

                      {selectedHostel.verification?.status === "rejected" && (
                        <div className="border-t border-gray-100 pt-4">
                          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">စီမံခန့်ခွဲသူ လုပ်ဆောင်ချက်များ</p>
                          <button
                            onClick={() => handleDelete(selectedHostel._id)}
                            disabled={actionLoading !== null}
                            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white py-2.5 rounded-lg text-sm font-semibold transition"
                          >
                            {actionLoading === "delete" ? "ဖျက်နေသည်..." : "အပြီးတိုင် ဖျက်ပစ်ရန်"}
                          </button>
                          <p className="text-xs text-gray-400 mt-2 text-center">
                            ဤလုပ်ဆောင်ချက်သည် ဂေဟာကို ဒေတာဘေ့စ်မှ အပြီးတိုင် ဖယ်ရှားပါမည်။
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
