"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function DonorsPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

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
    const fetchDonors = async () => {
      try {
        const res = await fetch("/api/donors");
        const data = await res.json();
        if (data.success) {
          setDonors(data.donors);
        } else {
          setError(data.error);
        }
      } catch (err) {
        setError("အလှူရှင်များ ခေါ်ယူ၍ မရပါ။");
      } finally {
        setLoading(false);
      }
    };
    fetchDonors();
  }, [authChecked]);

  const getInitials = (name) => {
    if (!name) return "?";
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const filteredDonors = donors.filter((donor) => {
    const query = searchQuery.toLowerCase();
    return donor.name?.toLowerCase().includes(query);
  });

  if (!authChecked || loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">အလှူရှင်များ ခေါ်ယူနေသည်...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">အမှားအယွင်း</h2>
          <p className="text-gray-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">အလှူရှင်များ</h1>
          <p className="text-gray-500">ပရောဂျက်တွင် ပါဝင်သော အလှူရှင်များအားလုံးကို ကြည့်ရှုပါ</p>
        </div>

        <div className="mb-6">
          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="အလှူရှင် အမည် ရှာဖွေရန်..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {filteredDonors.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-gray-500">
              {searchQuery ? "ရှာဖွေမှု ရလဒ် မတွေ့ပါ" : "အလှူရှင် မရှိသေးပါ"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDonors.map((donor) => (
              <Link
                key={donor._id}
                href={`/donors/${donor._id}`}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl hover:border-blue-200 transition group"
              >
                <div className="h-40 bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                  {donor.profileImage ? (
                    <img
                      src={donor.profileImage}
                      alt={donor.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl font-bold text-emerald-400">
                      {getInitials(donor.name)}
                    </span>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition truncate">
                    {donor.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-flex items-center gap-1 text-sm text-gray-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                      လက်မှတ် {donor.certificateCount}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {filteredDonors.length > 0 && (
          <p className="text-center text-sm text-gray-400 mt-8">
            စုစုပေါင်း အလှူရှင် {filteredDonors.length} ဦး
          </p>
        )}
      </div>
    </div>
  );
}
