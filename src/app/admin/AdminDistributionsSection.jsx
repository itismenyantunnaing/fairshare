"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const SCHEDULE_LABEL = { today: "ယနေ့", yesterday: "ယမန်နေ့", last_week: "ပြီးခဲ့သော အပတ်", custom: "စိတ်ကြိုက် ကာလ", all: "အလှူငွေအားလုံး" };
const SCHEDULE_OPTIONS = ["today", "yesterday", "last_week", "custom", "all"];

function formatDate(d) {
  if (!d) return "—";
  const x = new Date(d);
  return x.toLocaleDateString("my-MM", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminDistributionsSection() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [distributions, setDistributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formData, setFormData] = useState({
    scheduleType: "today",
    startDate: "",
    endDate: "",
    name: "",
  });

  const canManage = user?.canManageDistribution === true || user?.role === "super_admin";

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.success && data.user) setUser(data.user);
      } catch {}
    };
    checkAuth();
  }, []);

  const fetchDistributions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/distributions");
      const data = await res.json();
      if (data.success) setDistributions(data.distributions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && canManage) fetchDistributions();
    else if (user) setLoading(false);
  }, [user, canManage]);

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(t);
    }
  }, [success]);
  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(t);
    }
  }, [error]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        scheduleType: formData.scheduleType,
        name: formData.name.trim() || undefined,
      };
      if (formData.scheduleType === "custom") {
        if (!formData.startDate || !formData.endDate) {
          setError("စိတ်ကြိုက် ကာလအတွက် စတင်ရက် နှင့် ပြီးဆုံးရက် ထည့်ပါ။");
          setSubmitting(false);
          return;
        }
        payload.startDate = formData.startDate;
        payload.endDate = formData.endDate;
      }
      const res = await fetch("/api/admin/distributions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess("ဖြန့်ဝေမှု ဖန်တီးပြီးပါပြီ။ အတည်ပြု သို့မဟုတ် ပယ်ဖျက်ရန် အသေးစိတ်သို့ သွားပါ။");
        setShowForm(false);
        setFormData({ scheduleType: "today", startDate: "", endDate: "", name: "" });
        const distId = data.distribution?.id || data.distribution?._id?.toString();
        if (distId) router.push(`/admin/distributions/${distId}`);
        else fetchDistributions();
      } else {
        setError(data.error || "ဖြန့်ဝေမှု ဖန်တီး၍ မရပါ။");
      }
    } catch {
      setError("ဖြန့်ဝေမှု ဖန်တီး၍ မရပါ။");
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!canManage) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center text-gray-500">
        <p>ဖြန့်ဝေမှု စီမံခန့်ခွဲရန် ခွင့်ပြုချက် မရှိပါ။</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800">
          {success}
        </div>
      )}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800">
          {error}
        </div>
      )}

      {!showForm ? (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-blue-700 transition"
        >
          + ဖြန့်ဝေမှု အသစ် ဖန်တီးရန်
        </button>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">ဖြန့်ဝေမှု အသစ် ဖန်တီးရန်</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ကာလ ရွေးချယ်ရန်</label>
              <p className="text-xs text-gray-500 mb-2">
                ဤကာလအတွင်း အတည်ပြုပြီး အလှူများသာ ဤဖြန့်ဝေမှုတွင် ပါဝင်မည်။
              </p>
              <div className="flex gap-4 flex-wrap">
                {SCHEDULE_OPTIONS.map((key) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="scheduleType"
                      value={key}
                      checked={formData.scheduleType === key}
                      onChange={(e) => setFormData({ ...formData, scheduleType: e.target.value })}
                      className="text-blue-600"
                    />
                    <span className="text-sm text-gray-700">{SCHEDULE_LABEL[key]}</span>
                  </label>
                ))}
              </div>
            </div>
            {formData.scheduleType === "custom" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">စတင်ရက်</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ပြီးဆုံးရက်</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900"
                  />
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">အမည် (ရွေးချယ်မှု)</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="ဥပမာ - ဇန်နဝါရီ ၂၀၂၆ ဖြန့်ဝေမှု"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 rounded-lg text-white text-sm font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "ဖန်တီးနေသည်..." : "ဖန်တီးရန်"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setFormData({ scheduleType: "today", startDate: "", endDate: "", name: "" });
                }}
                className="px-4 py-2.5 rounded-lg text-gray-600 hover:text-gray-900 text-sm font-medium"
              >
                ပယ်ဖျက်ရန်
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full" />
          </div>
        ) : distributions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>ဖြန့်ဝေမှု မရှိသေးပါ။ အသစ် ဖန်တီးနိုင်ပါသည်။</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {distributions.map((d) => (
              <div
                key={d.id || d._id}
                className="flex items-center justify-between px-5 py-4 hover:bg-gray-50/50"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {d.name || "အမည်မသိ"}
                    {d.status === "draft" && (
                      <span className="ml-2 text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded">မအတည်ပြုရသေး</span>
                    )}
                  </p>
                  <p className="text-sm text-gray-500">
                    {SCHEDULE_LABEL[d.scheduleType] || d.scheduleType} · {formatDate(d.startDate)} — {formatDate(d.endDate)}
                  </p>
                </div>
                <Link
                  href={`/admin/distributions/${d.id || d._id}`}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-50"
                >
                  ကြည့်ရန်
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
