"use client";
import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function PublicShelterPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [shelter, setShelter] = useState(null);
  const [activities, setActivities] = useState([]);
  const [reliabilityScore, setReliabilityScore] = useState({ given: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Auth check - only logged in users can view
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (!data.success || !data.user) {
          router.push("/login");
          return;
        }
        setAuthChecked(true);
      } catch {
        router.push("/login");
      }
    };
    checkAuth();
  }, [router]);

  // Fetch shelter and activities only after auth is confirmed
  useEffect(() => {
    if (!authChecked) return;
    const fetchData = async () => {
      try {
        // Fetch shelter info
        const shelterRes = await fetch(`/api/shelters/${id}`);
        const shelterData = await shelterRes.json();
        if (shelterData.success) {
          setShelter(shelterData.shelter);
        } else {
          setError(shelterData.error);
          setLoading(false);
          return;
        }

        // Fetch activities
        const activitiesRes = await fetch(`/api/shelters/${id}/activities`);
        const activitiesData = await activitiesRes.json();
        if (activitiesData.success) {
          setActivities(activitiesData.activities);
          setReliabilityScore(activitiesData.reliabilityScore);
        }
      } catch (err) {
        setError("ခိုလှုံရာအိမ် အချက်အလက် ခေါ်ယူ၍ မရပါ။");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, authChecked]);

  const formatDate = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("my-MM", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get initials from shelter name
  const getInitials = (name) => {
    if (!name) return "?";
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  if (!authChecked || loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">ခိုလှုံရာအိမ် အချက်အလက် ခေါ်ယူနေသည်...</p>
        </div>
      </div>
    );
  }

  if (error || !shelter) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">ခိုလှုံရာအိမ် မတွေ့ပါ</h2>
          <p className="text-gray-500 text-sm">{error || "ဤခိုလှုံရာအိမ်ကို ရှာမတွေ့ပါ သို့မဟုတ် အတည်မပြုရသေးပါ။"}</p>
          <Link
            href="/shelters"
            className="inline-block mt-6 text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            ခိုလှုံရာအိမ်များသို့ ပြန်သွားရန်
          </Link>
        </div>
      </div>
    );
  }

  const hasProfileImage = shelter.profileImages?.length > 0;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Back link */}
        <Link
          href="/shelters"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          ခိုလှုံရာအိမ်များသို့ ပြန်သွားရန်
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {hasProfileImage ? (
                <img
                  src={shelter.profileImages[0]}
                  alt={shelter.hostelName}
                  className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">{getInitials(shelter.hostelName)}</span>
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">{shelter.hostelName}</h1>
                {/* Verified Badge */}
                <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  အတည်ပြုပြီး
                </span>
              </div>
              <p className="text-gray-500 flex items-center gap-1 mt-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {shelter.city}
              </p>
            </div>
          </div>

          {/* Reliability Score */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-3 text-center flex-shrink-0">
            <p className="text-xs text-gray-500 mb-1">ယုံကြည်စိတ်ချရမှု</p>
            <p className="text-xl font-bold text-blue-600">
              {reliabilityScore.given} / {reliabilityScore.total || reliabilityScore.given || 0}
            </p>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Profile Images Gallery */}
          {shelter.profileImages?.length > 0 && (
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-sm font-medium text-gray-700 mb-3">ဓာတ်ပုံများ</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {shelter.profileImages.map((img, idx) => (
                  <div key={idx} className="aspect-video rounded-lg overflow-hidden border border-gray-200">
                    <img src={img} alt={`ပရိုဖိုင် ${idx + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Info Section */}
          <div className="p-6 space-y-5">
            {/* Basic Info */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">အခြေခံ အချက်အလက်များ</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoField label="ခိုလှုံရာအိမ် အမည်" value={shelter.hostelName} />
                <InfoField label="မြို့" value={shelter.city} />
                <InfoField label="လိပ်စာ" value={shelter.address} />
                <InfoField label="ဖုန်းနံပါတ်" value={shelter.phone} />
              </div>
            </div>

            {/* Population */}
            {(shelter.population?.adults > 0 || shelter.population?.children > 0) && (
              <div className="border-t border-gray-100 pt-5">
                <h3 className="text-sm font-medium text-gray-700 mb-3">လူဦးရေ အချက်အလက်</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-blue-700">{shelter.population?.adults || 0}</p>
                    <p className="text-xs text-blue-600 mt-1">အရွယ်ရောက်ပြီးသူ</p>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-purple-700">{shelter.population?.children || 0}</p>
                    <p className="text-xs text-purple-600 mt-1">ကလေး</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Activities Section */}
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">လှုပ်ရှားမှုများ</h2>
          {activities.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <p className="text-gray-500 text-sm">မှတ်တမ်းတင်ထားသော လှုပ်ရှားမှု မရှိသေးပါ</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.slice(0, 5).map((activity) => (
                <Link
                  key={activity._id}
                  href={`/activities/${activity._id}`}
                  className="block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:border-blue-200 hover:shadow-md transition"
                >
                  <div className="flex">
                    {/* Thumbnail */}
                    {activity.images?.[0] && (
                      <div className="w-32 h-24 flex-shrink-0">
                        <img
                          src={activity.images[0]}
                          alt={activity.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-4 flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">
                          {activity.distributionName}
                        </span>
                        <span className="text-xs text-gray-400">{formatDate(activity.createdAt)}</span>
                      </div>
                      <h3 className="font-medium text-gray-900 truncate">{activity.title}</h3>
                      <p className="text-sm text-gray-500 line-clamp-1 mt-0.5">{activity.description}</p>
                    </div>
                  </div>
                </Link>
              ))}

              {activities.length > 5 && (
                <p className="text-center text-sm text-gray-400">
                  နောက်ထပ် လှုပ်ရှားမှု {activities.length - 5} ခု ရှိပါသေးသည်
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoField({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-400 font-medium">{label}</p>
      <p className="text-sm text-gray-900 mt-0.5">{value || "မရှိ"}</p>
    </div>
  );
}
