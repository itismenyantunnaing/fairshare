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
      <div className="max-w-6xl mx-auto">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activities.map((activity) => (
              <Link
                key={activity.id}
                href={`/activities/${activity.id}`}
                className="block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:border-blue-200 hover:shadow-md transition"
              >
                {activity.images?.length > 0 ? (
                  <div className="h-40 bg-gray-100 overflow-hidden">
                    <img
                      src={activity.images[0]}
                      alt={activity.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-40 bg-gray-100 flex items-center justify-center text-gray-400 text-sm">ပုံ မရှိပါ</div>
                )}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">
                      {activity.shelterName}
                    </span>
                    {activity.distributionDate && (
                      <span className="text-xs text-gray-400">{formatDate(activity.distributionDate)}</span>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{activity.title}</h3>
                  <p className="text-sm text-gray-600 line-clamp-3">{activity.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    {activity.images?.length > 0 && <span>{activity.images.length} ပုံ</span>}
                    <span>{formatDate(activity.createdAt)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
