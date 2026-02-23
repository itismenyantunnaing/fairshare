"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const SCHEDULE_LABEL = {
  today: "ယနေ့",
  yesterday: "ယမန်နေ့",
  last_week: "ပြီးခဲ့သော အပတ်",
  custom: "စိတ်ကြိုက် ကာလ",
  all: "အလှူငွေအားလုံး",
  this_day: "ယနေ့",
  this_week: "ဒီအပတ်",
  daily: "နေ့စဉ်",
  weekly: "အပတ်စဉ်",
};

function formatDate(d) {
  if (!d) return "—";
  const x = new Date(d);
  return x.toLocaleDateString("my-MM", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminDistributionDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [distribution, setDistribution] = useState(null);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.success && data.user) {
          if (!data.user.canManageDistribution) {
            router.replace("/admin");
            return;
          }
          setUser(data.user);
          setAuthChecked(true);
        } else {
          router.push("/login");
        }
      } catch {
        router.push("/login");
      }
    };
    checkAuth();
  }, [router]);

  const fetchDistribution = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/distributions/${id}`);
      const data = await res.json();
      if (data.success) setDistribution(data.distribution);
      else if (res.status === 403) router.replace("/admin");
      else if (res.status === 404) setDistribution(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authChecked && id) fetchDistribution();
  }, [authChecked, id]);

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

  const handleRemoveDonations = async () => {
    if (!confirm("ဤဖြန့်ဝေမှုတွင် ပါဝင်သော အလှူများအားလုံးကို ဖျက်မည်လား? ပြန်လည်ပြုပြင်၍ မရပါ။")) return;
    setRemoving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/distributions/${id}/donations`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setSuccess(data.message || "အလှူများ ဖျက်ပြီးပါပြီ။");
        fetchDistribution();
      } else {
        setError(data.error || "ဖျက်၍ မရပါ။");
      }
    } catch {
      setError("ဖျက်၍ မရပါ။");
    } finally {
      setRemoving(false);
    }
  };

  const handleConfirm = async () => {
    if (!confirm("ဤဖြန့်ဝေမှုကို အတည်ပြုမည်လား? အလှူများ ဤဖြန့်ဝေမှုသို့ ထည့်သွင်းပြီး စာရင်းမှ ပျောက်သွားမည်။")) return;
    setConfirming(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/distributions/${id}/confirm`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setSuccess(data.message || "အတည်ပြုပြီးပါပြီ။");
        fetchDistribution();
      } else {
        setError(data.error || "အတည်ပြု၍ မရပါ။");
      }
    } catch {
      setError("အတည်ပြု၍ မရပါ။");
    } finally {
      setConfirming(false);
    }
  };

  const handleCancelDistribution = async () => {
    const msg = (distribution?.status === "draft")
      ? "ဤဖြန့်ဝေမှုကို ပယ်ဖျက်မည်လား? အလှူများ ပြန်လည် သုံးစွဲနိုင်ပါမည်။"
      : "ဤဖြန့်ဝေမှုကို ဖျက်မည်လား? အလှူများ ပြန်လည် သုံးစွဲနိုင်ပါမည်။";
    if (!confirm(msg)) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/distributions/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        router.push("/admin?tab=distributions");
        return;
      }
      setError(data.error || "ဖျက်၍ မရပါ။");
    } catch {
      setError("ဖျက်၍ မရပါ။");
    } finally {
      setDeleting(false);
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

  if (loading || !distribution) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4 flex items-center justify-center">
        {loading ? (
          <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full" />
        ) : (
          <div className="text-center text-gray-500">
            <p>ဖြန့်ဝေမှု မတွေ့ပါ။</p>
            <Link href="/admin?tab=distributions" className="text-blue-600 hover:underline mt-2 inline-block">
              ပြန်သွားရန်
            </Link>
          </div>
        )}
      </div>
    );
  }

  const ended = distribution.deadlinePassed === true;
  const donationIds = distribution.donationIds || [];
  const hasDonations = donationIds.length > 0;
  const isDraft = distribution.status === "draft";

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/admin?tab=distributions" className="text-sm text-gray-600 hover:text-gray-900">
              ← ဖြန့်ဝေမှုများ
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">
              {distribution.name || "ဖြန့်ဝေမှု အသေးစိတ်"}
            </h1>
          </div>
        </div>

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800">
            {error}
          </div>
        )}

        <div className="mb-6 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500">
            အလှူကာလ: {SCHEDULE_LABEL[distribution.scheduleType] || distribution.scheduleType}
            {(distribution.donationPeriodStart || distribution.donationPeriodEnd) && (
              <span className="ml-1 text-gray-700">
                ({formatDate(distribution.donationPeriodStart)} — {formatDate(distribution.donationPeriodEnd)})
              </span>
            )}
          </p>
          <p className="text-sm text-gray-700 mt-1">
            ဖန်တီးရက်: {formatDate(distribution.startDate)}
            {distribution.deadlineDate && (
              <span className="ml-2">
                · နောက်ဆုံးတင်ရက်: <span className={distribution.deadlinePassed ? "text-red-600 font-medium" : "text-green-700 font-medium"}>{formatDate(distribution.deadlineDate)}</span>
              </span>
            )}
          </p>
          {isDraft && (
            <span className="inline-block mt-2 text-xs font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded">
              မအတည်ပြုရသေး (အလှူများ မထည့်ရသေး)
            </span>
          )}
          {ended && !isDraft && (
            <span className="inline-block mt-2 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded">
              ပြီးဆုံးပြီး
            </span>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {isDraft && (
              <button
                type="button"
                onClick={handleConfirm}
                disabled={confirming || deleting}
                className="text-sm font-medium text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-lg transition disabled:opacity-50"
              >
                {confirming ? "အတည်ပြုနေသည်..." : "အတည်ပြုမည်"}
              </button>
            )}
            <button
              type="button"
              onClick={handleCancelDistribution}
              disabled={deleting || confirming}
              className="text-sm font-medium text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg transition disabled:opacity-50"
            >
              {deleting ? "ဖျက်နေသည်..." : isDraft ? "ပယ်ဖျက်မည်" : "ဖြန့်ဝေမှု ဖျက်မည် (အလှူများ ပြန်သွင်းမည်)"}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">ခိုလှုံရာအိမ်များ ချထားပေးမှု</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">ခိုလှုံရာအိမ်</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">လှုပ်ရှားမှု</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">ငွေ (MMK)</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">ပြည်</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">ဆေးဝါး</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">အဝတ်အစား</th>
                </tr>
              </thead>
              <tbody>
                {(distribution.allocations || []).map((a, i) => {
                  const posted = a.activityPosted === true;
                  const withinDeadline = a.activityWithinDeadline === true;
                  const deadlinePassed = distribution.deadlinePassed === true;
                  let activityLabel = "မတင်ရသေး";
                  if (posted) activityLabel = withinDeadline ? "တင်ပြီး (ရက်စွဲအတွင်း)" : "တင်ပြီး (ရက်ကျော်)";
                  else if (deadlinePassed) activityLabel = "ရက်ကျော်";
                  return (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-3 px-4 font-medium text-gray-900">{a.shelterName}</td>
                    <td className="py-3 px-4 text-gray-700">{activityLabel}</td>
                    <td className="py-3 px-4 text-right text-gray-700">
                      {Number(a.money || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-700">
                      {a.food?.totalPyi != null ? Number(a.food.totalPyi).toLocaleString() : "—"}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {a.medical?.items?.length
                        ? a.medical.items.map((it, j) => `${it.type || "—"} ×${it.quantity}`).join(", ")
                        : "—"}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {a.clothing?.items?.length
                        ? a.clothing.items.map((it, j) => `${it.type || "—"} ×${it.quantity}`).join(", ")
                        : "—"}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
            <h2 className="font-semibold text-gray-900">ဤဖြန့်ဝေမှုတွင် ပါဝင်သော အလှူများ</h2>
            {ended && hasDonations && (
              <button
                type="button"
                onClick={handleRemoveDonations}
                disabled={removing}
                className="text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition disabled:opacity-50"
              >
                {removing ? "ဖျက်နေသည်..." : "ဤအလှူများ ဖျက်မည်"}
              </button>
            )}
          </div>
          <div className="px-5 py-4">
            {hasDonations ? (
              <p className="text-sm text-gray-600">
                အလှူအရေအတွက်: {donationIds.length} ခု (ဖျက်ပြီးပါက ဤစာရင်းမှ ပျောက်သွားမည်)
              </p>
            ) : (
              <p className="text-sm text-gray-500">အလှူ မရှိပါ (သို့မဟုတ် ဖျက်ပြီးပါပြီ)။</p>
            )}
          </div>
        </div>

        {/* Activities (posts) for this distribution */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">ဤဖြန့်ဝေမှုနှင့် ဆိုင်သော လှုပ်ရှားမှုများ</h2>
            <p className="text-sm text-gray-500 mt-1">
              ခိုလှုံရာအိမ်များ တင်ထားသော ပို့စ်များ
            </p>
          </div>
          <div className="px-5 py-4">
            {(distribution.activities || []).length === 0 ? (
              <p className="text-sm text-gray-500">ဤဖြန့်ဝေမှုအတွက် လှုပ်ရှားမှု မရှိသေးပါ။</p>
            ) : (
              <div className="space-y-4">
                {(distribution.activities || []).map((activity) => (
                  <div
                    key={activity.id}
                    className="border border-gray-100 rounded-xl overflow-hidden"
                  >
                    {activity.images?.length > 0 && (
                      <div className="h-40 bg-gray-100 overflow-hidden">
                        <img
                          src={activity.images[0]}
                          alt={activity.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">
                          {activity.shelterName}
                        </span>
                        {activity.distributionDate && (
                          <span className="text-xs text-gray-400">
                            {formatDate(activity.distributionDate)}
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900">{activity.title}</h3>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-3">{activity.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        {activity.images?.length > 0 && (
                          <span>{activity.images.length} ပုံ</span>
                        )}
                        <span>{formatDate(activity.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
