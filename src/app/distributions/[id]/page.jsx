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
};

function formatDate(d) {
  if (!d) return "—";
  const x = new Date(d);
  return x.toLocaleDateString("my-MM", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function DistributionDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [distribution, setDistribution] = useState(null);
  const [activities, setActivities] = useState([]);
  const [shelterCanAddPost, setShelterCanAddPost] = useState(false);
  const [shelterId, setShelterId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (!data.success || !data.user) {
          router.push("/login");
          return;
        }
        const role = data.user.role;
        if (role !== "donor" && role !== "shelter") {
          router.push("/");
          return;
        }
        setAuthChecked(true);
      } catch {
        router.push("/login");
      }
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    if (!authChecked || !id) return;
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/distributions/${id}`);
        const data = await res.json();
        if (data.success) {
          setDistribution(data.distribution);
          setActivities(data.activities || []);
          setShelterCanAddPost(!!data.shelterCanAddPost);
          setShelterId(data.shelterId || null);
        } else {
          setDistribution(null);
          setActivities([]);
        }
      } catch (err) {
        console.error(err);
        setDistribution(null);
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [authChecked, id]);

  if (!authChecked) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!distribution) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">ဖြန့်ဝေမှု မတွေ့ပါ။</p>
          <Link href="/distributions" className="text-blue-600 hover:underline mt-2 inline-block">
            ပြန်သွားရန်
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/distributions" className="text-sm text-gray-600 hover:text-gray-900 mb-2 inline-block">
            ← ဖြန့်ဝေမှုများ
          </Link>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {distribution.name || "ဖြန့်ဝေမှု"}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {SCHEDULE_LABEL[distribution.scheduleType] || distribution.scheduleType}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                အလှူကာလ: {formatDate(distribution.donationPeriodStart)} — {formatDate(distribution.donationPeriodEnd)}
              </p>
            </div>
            {shelterCanAddPost && shelterId && (
              <Link
                href={`/shelter/${shelterId}/activities?distributionId=${id}`}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                ပို့စ် တင်ရန်
              </Link>
            )}
          </div>
        </div>

        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          ဤဖြန့်ဝေမှုနှင့် ဆိုင်သော လှုပ်ရှားမှုများ
        </h2>

        {activities.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <p className="text-gray-500">ဤဖြန့်ဝေမှုအတွက် လှုပ်ရှားမှု မရှိသေးပါ။</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
              >
                {activity.images?.length > 0 && (
                  <div className="h-48 bg-gray-100 overflow-hidden">
                    <img
                      src={activity.images[0]}
                      alt={activity.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-5">
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
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{activity.title}</h3>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{activity.description}</p>
                  <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400">
                    {activity.images?.length > 0 && (
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {activity.images.length} ပုံ
                      </span>
                    )}
                    <span>{formatDate(activity.createdAt)}</span>
                  </div>
                  {activity.images && activity.images.length > 1 && (
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-3">
                      {activity.images.slice(1, 6).map((img, idx) => (
                        <a
                          key={idx}
                          href={img}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block aspect-square rounded-lg overflow-hidden border border-gray-200"
                        >
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        </a>
                      ))}
                      {activity.images.length > 6 && (
                        <span className="flex items-center justify-center text-xs text-gray-500">
                          +{activity.images.length - 6} ပုံ
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
