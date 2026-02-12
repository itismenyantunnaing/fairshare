"use client";
import { useState, useEffect, useCallback } from "react";

const STATUS_TABS = [
  { key: "pending", label: "Pending Review" },
  { key: "approved", label: "Approved" },
  { key: "auto_rejected", label: "Auto-Rejected" },
  { key: "rejected", label: "Rejected" },
];

const STATUS_COLORS = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  approved: "bg-green-100 text-green-800 border-green-200",
  auto_rejected: "bg-orange-100 text-orange-800 border-orange-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
};

export default function AdminHostels() {
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedHostel, setSelectedHostel] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [reviewNote, setReviewNote] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchHostels = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/hostels?status=${activeTab}`);
      const data = await res.json();
      if (data.success) {
        setHostels(data.hostels);
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
        alert(data.message);
        setSelectedHostel(null);
        setReviewNote("");
        fetchHostels();
      } else {
        alert(data.error || "Action failed");
      }
    } catch (error) {
      console.error("Error performing action:", error);
      alert("Network error. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to permanently delete this hostel?")) {
      return;
    }
    setActionLoading("delete");
    try {
      const res = await fetch(`/api/hostels/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setSelectedHostel(null);
        fetchHostels();
      } else {
        alert(data.error || "Delete failed");
      }
    } catch (error) {
      console.error("Error deleting hostel:", error);
      alert("Network error. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Filter hostels based on search query
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              FairShare Admin
            </h1>
            <p className="text-sm text-gray-500">Hostel Registration Management</p>
          </div>
          <a
            href="/onboarding"
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            View Registration Form
          </a>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Status Tabs & Search */}
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  setSelectedHostel(null);
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
              placeholder="Search hostels..."
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

        <div className="flex gap-6">
          {/* Hostel List */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Loading hostels...</p>
              </div>
            ) : filteredHostels.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                {searchQuery ? (
                  <p className="text-gray-400 text-sm">
                    No results for &quot;{searchQuery}&quot; in {activeTab.replace("_", " ")} hostels
                  </p>
                ) : (
                  <p className="text-gray-400 text-sm">
                    No hostels with status &quot;{activeTab}&quot;
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredHostels.map((hostel) => (
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
                          {hostel.verification?.status?.replace("_", " ") || "unknown"}
                        </span>
                        {hostel.verification?.autoCheckPassed && (
                          <span className="text-xs text-green-600 font-medium">
                            AI Verified
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <p className="text-xs text-gray-400">
                        Submitted: {formatDate(hostel.createdAt)}
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
                              Approve
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
                              Reject
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
                              Delete
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Detail Panel */}
          {selectedHostel && (
            <div className="w-[480px] flex-shrink-0">
              <div className="bg-white rounded-xl border border-gray-200 sticky top-24 overflow-hidden">
                {detailLoading ? (
                  <div className="p-12 text-center">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
                  </div>
                ) : (
                  <>
                    {/* Header */}
                    <div className="p-5 border-b border-gray-100">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {selectedHostel.hostelName}
                        </h3>
                        <button
                          onClick={() => setSelectedHostel(null)}
                          className="text-gray-400 hover:text-gray-600 text-xl leading-none"
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
                        {selectedHostel.verification?.status?.replace("_", " ")}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="p-5 space-y-4">
                      <div>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                          Address
                        </p>
                        <p className="text-sm text-gray-700 mt-0.5">
                          {selectedHostel.address}, {selectedHostel.city}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                          Email
                        </p>
                        <p className="text-sm text-gray-700 mt-0.5">
                          {selectedHostel.email || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                          Phone
                        </p>
                        <p className="text-sm text-gray-700 mt-0.5">
                          {selectedHostel.phone}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                          Submitted
                        </p>
                        <p className="text-sm text-gray-700 mt-0.5">
                          {formatDate(selectedHostel.createdAt)}
                        </p>
                      </div>

                      {/* Certificate Image */}
                      {selectedHostel.licenseImage && (
                        <div>
                          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">
                            Certificate Image
                          </p>
                          <img
                            src={selectedHostel.licenseImage}
                            alt="Hostel Certificate"
                            className="w-full rounded-lg border border-gray-200"
                          />
                        </div>
                      )}

                      {/* AI Analysis */}
                      {selectedHostel.verification?.visionAnalysis && (
                        <div>
                          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">
                            AI Analysis
                          </p>
                          <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-3">
                            {/* Verdict & Score */}
                            <div className="flex justify-between items-center">
                              <span
                                className={`font-medium ${
                                  selectedHostel.verification.autoCheckPassed
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {selectedHostel.verification.autoCheckPassed
                                  ? "Looks Legitimate"
                                  : "Not Verified"}
                              </span>
                              <span className="text-xs text-gray-400">
                                Score: {selectedHostel.verification.visionAnalysis.score || 0}
                                {selectedHostel.verification.visionAnalysis.confidence
                                  ? ` | OCR: ${selectedHostel.verification.visionAnalysis.confidence}%`
                                  : ""}
                              </span>
                            </div>

                            {/* Extracted Fields */}
                            {selectedHostel.verification.visionAnalysis.extractedFields && (
                              <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
                                <div className="flex justify-between px-3 py-2">
                                  <span className="text-gray-500 text-xs">Registration No.</span>
                                  <span className="text-gray-900 text-xs font-medium">
                                    {selectedHostel.verification.visionAnalysis.extractedFields.registrationNo || "Not found"}
                                  </span>
                                </div>
                                <div className="flex justify-between px-3 py-2">
                                  <span className="text-gray-500 text-xs">Issue Date</span>
                                  <span className="text-gray-900 text-xs font-medium">
                                    {selectedHostel.verification.visionAnalysis.extractedFields.issueDate || "Not found"}
                                  </span>
                                </div>
                                <div className="flex justify-between px-3 py-2">
                                  <span className="text-gray-500 text-xs">Expiry Date</span>
                                  <span className="text-gray-900 text-xs font-medium">
                                    {selectedHostel.verification.visionAnalysis.extractedFields.expiryDate || "Not found"}
                                  </span>
                                </div>
                                <div className="flex justify-between px-3 py-2">
                                  <span className="text-gray-500 text-xs">Authorized By</span>
                                  <span className="text-gray-900 text-xs font-medium text-right max-w-[200px]">
                                    {selectedHostel.verification.visionAnalysis.extractedFields.authorizedBy || "Not found"}
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Keyword Categories */}
                            {selectedHostel.verification.visionAnalysis.details && (
                              <div className="space-y-2">
                                {selectedHostel.verification.visionAnalysis.details.primaryMatches?.length > 0 && (
                                  <div>
                                    <span className="text-gray-500 text-xs block mb-1">Certificate Keywords</span>
                                    <div className="flex flex-wrap gap-1">
                                      {selectedHostel.verification.visionAnalysis.details.primaryMatches.map((kw) => (
                                        <span key={kw} className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded">{kw}</span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {selectedHostel.verification.visionAnalysis.details.authorityMatches?.length > 0 && (
                                  <div>
                                    <span className="text-gray-500 text-xs block mb-1">Authority Keywords</span>
                                    <div className="flex flex-wrap gap-1">
                                      {selectedHostel.verification.visionAnalysis.details.authorityMatches.map((kw) => (
                                        <span key={kw} className="bg-purple-50 text-purple-700 text-xs px-2 py-0.5 rounded">{kw}</span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {selectedHostel.verification.visionAnalysis.details.domainMatches?.length > 0 && (
                                  <div>
                                    <span className="text-gray-500 text-xs block mb-1">Domain Keywords</span>
                                    <div className="flex flex-wrap gap-1">
                                      {selectedHostel.verification.visionAnalysis.details.domainMatches.map((kw) => (
                                        <span key={kw} className="bg-green-50 text-green-700 text-xs px-2 py-0.5 rounded">{kw}</span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {selectedHostel.verification.visionAnalysis.details.documentMatches?.length > 0 && (
                                  <div>
                                    <span className="text-gray-500 text-xs block mb-1">Document Keywords</span>
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
                                <span className="text-red-500 text-xs">
                                  Error: {selectedHostel.verification.visionAnalysis.error}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Review info (if already reviewed) */}
                      {selectedHostel.verification?.reviewedAt && (
                        <div>
                          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">
                            Review Details
                          </p>
                          <p className="text-sm text-gray-700">
                            Reviewed: {formatDate(selectedHostel.verification.reviewedAt)}
                          </p>
                          {selectedHostel.verification.reviewNote && (
                            <p className="text-sm text-gray-600 mt-1 italic">
                              &quot;{selectedHostel.verification.reviewNote}&quot;
                            </p>
                          )}
                        </div>
                      )}

                      {/* Admin Actions - Approve/Reject for pending & auto_rejected */}
                      {(selectedHostel.verification?.status === "pending" ||
                        selectedHostel.verification?.status === "auto_rejected") && (
                        <div className="border-t border-gray-100 pt-4">
                          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">
                            Admin Actions
                          </p>
                          <textarea
                            value={reviewNote}
                            onChange={(e) => setReviewNote(e.target.value)}
                            placeholder="Add a review note (optional)..."
                            className="w-full p-3 border border-gray-300 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                            rows={2}
                          />
                          <div className="flex gap-3 mt-3">
                            <button
                              onClick={() =>
                                handleAction(selectedHostel._id, "approve")
                              }
                              disabled={actionLoading !== null}
                              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white py-2.5 rounded-lg text-sm font-semibold transition"
                            >
                              {actionLoading === "approve"
                                ? "Approving..."
                                : "Approve"}
                            </button>
                            <button
                              onClick={() =>
                                handleAction(selectedHostel._id, "reject")
                              }
                              disabled={actionLoading !== null}
                              className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white py-2.5 rounded-lg text-sm font-semibold transition"
                            >
                              {actionLoading === "reject"
                                ? "Rejecting..."
                                : "Reject"}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Delete button for rejected hostels */}
                      {selectedHostel.verification?.status === "rejected" && (
                        <div className="border-t border-gray-100 pt-4">
                          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">
                            Admin Actions
                          </p>
                          <button
                            onClick={() => handleDelete(selectedHostel._id)}
                            disabled={actionLoading !== null}
                            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white py-2.5 rounded-lg text-sm font-semibold transition"
                          >
                            {actionLoading === "delete"
                              ? "Deleting..."
                              : "Delete Permanently"}
                          </button>
                          <p className="text-xs text-gray-400 mt-2 text-center">
                            This will permanently remove this hostel from the database.
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
