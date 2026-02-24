"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/context/ToastContext";

export default function ActivityDetailPage({ params }) {
  const { activityId } = use(params);
  const router = useRouter();
  const { showToast } = useToast();
  const [authChecked, setAuthChecked] = useState(false);
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  // Auth check
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

  // Fetch activity
  useEffect(() => {
    if (!authChecked) return;
    const fetchActivity = async () => {
      try {
        const res = await fetch(`/api/activities/${activityId}`);
        const data = await res.json();
        if (data.success) {
          setActivity(data.activity);
        } else {
          showToast(data.error, "error");
          setLoadFailed(true);
        }
      } catch (err) {
        showToast("လှုပ်ရှားမှု အချက်အလက် ခေါ်ယူ၍ မရပါ။", "error");
        setLoadFailed(true);
      } finally {
        setLoading(false);
      }
    };
    fetchActivity();
  }, [activityId, authChecked]);

  const formatDate = (date) => {
    if (!date) return "မသိ";
    return new Date(date).toLocaleDateString("my-MM", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

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
          <p className="text-gray-500">လှုပ်ရှားမှု ခေါ်ယူနေသည်...</p>
        </div>
      </div>
    );
  }

  if (loadFailed || !activity) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">လှုပ်ရှားမှု မတွေ့ပါ</h2>
          <p className="text-gray-500 text-sm">လှုပ်ရှားမှု အချက်အလက် ခေါ်ယူ၍ မရပါ။ မှတ်ချက်ကို ညာဘက် အနားမှ ကြည့်ပါ။</p>
          <Link
            href="/shelters"
            className="inline-block mt-6 text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            ဂေဟာများသို့ ပြန်သွားရန်
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Back Link */}
        <Link
          href={`/shelters/${activity.shelterId}`}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          ဂေဟာသို့ ပြန်သွားရန်
        </Link>

        {/* Activity Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Shelter Info */}
          <div className="p-5 border-b border-gray-100 flex items-center gap-3">
            {activity.shelter?.profileImages?.[0] ? (
              <img
                src={activity.shelter.profileImages[0]}
                alt={activity.shelterName}
                className="w-12 h-12 rounded-full object-cover border border-gray-200"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-sm font-bold text-white">{getInitials(activity.shelterName)}</span>
              </div>
            )}
            <div>
              <Link
                href={`/shelters/${activity.shelterId}`}
                className="font-medium text-gray-900 hover:text-blue-600"
              >
                {activity.shelterName}
              </Link>
              {activity.shelter?.city && (
                <p className="text-xs text-gray-400">{activity.shelter.city}</p>
              )}
            </div>
          </div>

          {/* Images Gallery */}
          {activity.images?.length > 0 && (
            <div className="p-5 border-b border-gray-100">
              {/* Main Image */}
              <div className="rounded-xl overflow-hidden mb-3">
                <img
                  src={selectedImage || activity.images[0]}
                  alt={activity.title}
                  className="w-full max-h-96 object-contain bg-gray-50"
                />
              </div>
              {/* Thumbnails */}
              {activity.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {activity.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(img)}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition ${
                        (selectedImage || activity.images[0]) === img
                          ? "border-blue-500"
                          : "border-transparent hover:border-gray-300"
                      }`}
                    >
                      <img src={img} alt={`ပုံ ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Content */}
          <div className="p-5">
            {/* Distribution Badge */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="bg-blue-100 text-blue-700 text-sm font-medium px-3 py-1 rounded-full">
                {activity.distributionName}
              </span>
              {activity.distributionDate && (
                <span className="text-sm text-gray-400">
                  ဖြန့်ဝေသည့်နေ့ - {formatDate(activity.distributionDate)}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-xl font-bold text-gray-900 mb-3">{activity.title}</h1>

            {/* Description */}
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{activity.description}</p>

            {/* Posted Date */}
            <div className="mt-5 pt-5 border-t border-gray-100">
              <p className="text-xs text-gray-400">
                တင်သည့်နေ့စွဲ - {formatDate(activity.createdAt)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
