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
        {/* Status Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg mb-6 w-fit">
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

        <div className="flex gap-6">
          {/* Hostel List */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Loading hostels...</p>
              </div>
            ) : hostels.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <p className="text-gray-400 text-sm">
                  No hostels with status &quot;{activeTab}&quot;
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {hostels.map((hostel) => (
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
                    <p className="text-xs text-gray-400 mt-3">
                      Submitted: {formatDate(hostel.createdAt)}
                    </p>
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

                      {/* Vision API Analysis */}
                      {selectedHostel.verification?.visionAnalysis && (
                        <div>
                          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">
                            AI Analysis
                          </p>
                          <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-500">
                                Confidence Score
                              </span>
                              <span className="font-medium text-gray-900">
                                {selectedHostel.verification.visionAnalysis.score || 0}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">AI Verdict</span>
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
                            </div>
                            {selectedHostel.verification.visionAnalysis
                              .matchedKeywords?.length > 0 && (
                              <div>
                                <span className="text-gray-500 block mb-1">
                                  Matched Keywords
                                </span>
                                <div className="flex flex-wrap gap-1">
                                  {selectedHostel.verification.visionAnalysis.matchedKeywords.map(
                                    (kw) => (
                                      <span
                                        key={kw}
                                        className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded"
                                      >
                                        {kw}
                                      </span>
                                    )
                                  )}
                                </div>
                              </div>
                            )}
                            {selectedHostel.verification.visionAnalysis
                              .detectedLabels?.length > 0 && (
                              <div>
                                <span className="text-gray-500 block mb-1">
                                  Detected Labels
                                </span>
                                <div className="flex flex-wrap gap-1">
                                  {selectedHostel.verification.visionAnalysis.detectedLabels
                                    .slice(0, 10)
                                    .map((label) => (
                                      <span
                                        key={label}
                                        className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded"
                                      >
                                        {label}
                                      </span>
                                    ))}
                                </div>
                              </div>
                            )}
                            {selectedHostel.verification.visionAnalysis
                              .textPreview && (
                              <div>
                                <span className="text-gray-500 block mb-1">
                                  Detected Text
                                </span>
                                <p className="text-xs text-gray-600 bg-white p-2 rounded border border-gray-200 max-h-24 overflow-y-auto">
                                  {selectedHostel.verification.visionAnalysis.textPreview}
                                </p>
                              </div>
                            )}
                            {selectedHostel.verification.visionAnalysis
                              .error && (
                              <div>
                                <span className="text-red-500 text-xs">
                                  Error:{" "}
                                  {selectedHostel.verification.visionAnalysis.error}
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
