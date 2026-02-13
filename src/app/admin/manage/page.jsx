"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminManagePage() {
  const router = useRouter();
  const [admin, setAdmin] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Auth check — super admin only (unified)
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.success && data.user && data.user.role === "super_admin") {
          setAdmin(data.user);
          setAuthChecked(true);
        } else {
          router.push("/login");
        }
      } catch {
        router.push("/login");
      }
    };
    checkAdmin();
  }, [router]);

  // Fetch admins list
  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/manage");
      const data = await res.json();
      if (data.success) {
        setAdmins(data.admins);
      }
    } catch (err) {
      console.error("Error fetching admins:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authChecked) fetchAdmins();
  }, [authChecked]);

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

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(data.message);
        setFormData({ name: "", email: "", password: "" });
        setShowForm(false);
        fetchAdmins();
      } else {
        setError(data.error);
      }
    } catch {
      setError("စီမံခန့်ခွဲသူ ဖန်တီးခြင်း မအောင်မြင်ပါ။");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (adminId, adminName) => {
    if (!confirm(`"${adminName}" စီမံခန့်ခွဲသူ အကောင့်ကို ဖျက်လိုသည်မှာ သေချာပါသလား?`)) {
      return;
    }
    setDeleting(adminId);
    setError(null);

    try {
      const res = await fetch("/api/admin/manage", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(data.message);
        fetchAdmins();
      } else {
        setError(data.error);
      }
    } catch {
      setError("စီမံခန့်ခွဲသူ ဖျက်ခြင်း မအောင်မြင်ပါ။");
    } finally {
      setDeleting(null);
    }
  };

  if (!authChecked) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-gray-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">စစ်ဆေးနေသည်...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-6">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">
            စီမံခန့်ခွဲသူ စီမံခန့်ခွဲမှု
          </h1>
          <p className="text-sm text-gray-500">စီမံခန့်ခွဲသူ အကောင့်များ ဖန်တီးခြင်းနှင့် ဖျက်ခြင်း</p>
        </div>
        {/* Messages */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-green-800">{success}</p>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Create Admin Button / Form */}
        <div className="mb-6">
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="bg-gray-900 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-gray-800 transition"
            >
              + စီမံခန့်ခွဲသူ အသစ်ထည့်ရန်
            </button>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                စီမံခန့်ခွဲသူ အကောင့်အသစ် ဖန်တီးရန်
              </h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    အမည်
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="ဥပမာ - မောင်မောင်"
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-gray-500 focus:border-gray-500 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    အီးမေးလ်
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="ဥပမာ - admin@fairshare.com"
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-gray-500 focus:border-gray-500 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    စကားဝှက်
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="အနည်းဆုံး ၆ လုံး"
                    required
                    minLength={6}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-gray-500 focus:border-gray-500 outline-none transition"
                  />
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={creating}
                    className={`text-sm font-semibold px-5 py-2.5 rounded-lg text-white transition ${
                      creating ? "bg-gray-400 cursor-not-allowed" : "bg-gray-900 hover:bg-gray-800"
                    }`}
                  >
                    {creating ? "ဖန်တီးနေသည်..." : "ဖန်တီးရန်"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setFormData({ name: "", email: "", password: "" });
                    }}
                    className="text-sm font-medium text-gray-500 hover:text-gray-700 px-4 py-2.5"
                  >
                    ပယ်ဖျက်ရန်
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Admins List */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-gray-400 border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-gray-400 text-sm">ခေါ်ယူနေသည်...</p>
            </div>
          ) : admins.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p>စီမံခန့်ခွဲသူ အကောင့် မရှိပါ</p>
            </div>
          ) : (
            admins.map((a) => (
              <div
                key={a._id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-gray-600">
                      {a.name?.charAt(0)?.toUpperCase() || "A"}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{a.name}</p>
                    <p className="text-sm text-gray-500">{a.email}</p>
                  </div>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      a.role === "super_admin"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {a.role === "super_admin" ? "Super Admin" : "Admin"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {a._id !== admin?.id && a.role !== "super_admin" && (
                    <button
                      onClick={() => handleDelete(a._id, a.name)}
                      disabled={deleting === a._id}
                      className="text-sm text-red-500 hover:text-red-700 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
                    >
                      {deleting === a._id ? "ဖျက်နေသည်..." : "ဖျက်ရန်"}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
