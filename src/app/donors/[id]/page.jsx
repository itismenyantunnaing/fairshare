"use client";
import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function PublicDonorPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [donor, setDonor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  useEffect(() => {
    if (!authChecked) return;
    const fetchDonor = async () => {
      try {
        const res = await fetch(`/api/donors/${id}`);
        const data = await res.json();
        if (data.success) {
          setDonor(data.donor);
        } else {
          setError(data.error);
        }
      } catch (err) {
        setError("အလှူရှင် အချက်အလက် ခေါ်ယူ၍ မရပါ။");
      } finally {
        setLoading(false);
      }
    };
    fetchDonor();
  }, [id, authChecked]);

  const getInitials = (name) => {
    if (!name) return "?";
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const formatDate = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("my-MM", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (!authChecked || loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">အလှူရှင် အချက်အလက် ခေါ်ယူနေသည်...</p>
        </div>
      </div>
    );
  }

  if (error || !donor) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">အလှူရှင် မတွေ့ပါ</h2>
          <p className="text-gray-500 text-sm">{error || "ဤအလှူရှင်ကို ရှာမတွေ့ပါ။"}</p>
          <Link
            href="/donors"
            className="inline-block mt-6 text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            အလှူရှင်များသို့ ပြန်သွားရန်
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/donors"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          အလှူရှင်များသို့ ပြန်သွားရန်
        </Link>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-br from-emerald-100 to-teal-100 p-8 flex flex-col sm:flex-row items-center gap-6">
            {donor.profileImage ? (
              <img
                src={donor.profileImage}
                alt={donor.name}
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md flex-shrink-0"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center border-4 border-white shadow-md flex-shrink-0">
                <span className="text-3xl font-bold text-white">{getInitials(donor.name)}</span>
              </div>
            )}
            <div className="text-center sm:text-left">
              <h1 className="text-2xl font-bold text-gray-900">{donor.name}</h1>
              <p className="text-gray-500 text-sm mt-1">
                ပါဝင်သည့်ရက် · {formatDate(donor.createdAt)}
              </p>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
              <span className="text-sm font-medium text-gray-700">အတည်ပြုလက်မှတ် ရရှိပြီး</span>
              <span className="text-lg font-bold text-emerald-600">{donor.certificateCount}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
