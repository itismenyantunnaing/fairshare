"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/context/ToastContext";

export default function SheltersPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [authChecked, setAuthChecked] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [shelters, setShelters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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
        setCurrentUser(data.user);
        setAuthChecked(true);
      } catch {
        router.push("/login");
      }
    };
    checkAuth();
  }, [router]);

  const fetchShelters = async () => {
    try {
      const res = await fetch("/api/shelters");
      const data = await res.json();
      if (data.success) {
        setShelters(data.shelters || []);
      } else {
        showToast(data.error, "error");
        setLoadFailed(true);
      }
    } catch (err) {
      showToast("ဂေဟာများ ခေါ်ယူ၍ မရပါ။", "error");
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  };

  // Fetch shelters after auth, and refetch when window gains focus (so reliability score updates)
  useEffect(() => {
    if (!authChecked) return;
    fetchShelters();
  }, [authChecked]);

  useEffect(() => {
    if (!authChecked) return;
    const onFocus = () => fetchShelters();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [authChecked]);

  // Get initials from shelter name
  const getInitials = (name) => {
    if (!name) return "?";
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Filter out own shelter card, then apply search query
  const filteredShelters = shelters
    .filter((shelter) => {
      if (currentUser?.role === "shelter" && shelter._id === currentUser.id) return false;
      return true;
    })
    .filter((shelter) => {
      const query = searchQuery.toLowerCase();
      return (
        shelter.hostelName?.toLowerCase().includes(query) ||
        shelter.city?.toLowerCase().includes(query) ||
        shelter.address?.toLowerCase().includes(query)
      );
    });

  if (!authChecked || loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">ဂေဟာများ ခေါ်ယူနေသည်...</p>
        </div>
      </div>
    );
  }

  if (loadFailed) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">အမှားအယွင်း</h2>
          <p className="text-gray-500 text-sm">ဂေဟာများ ခေါ်ယူ၍ မရပါ။ မှတ်ချက်ကို ညာဘက် အနားမှ ကြည့်ပါ။</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ဂေဟာများ</h1>
          <p className="text-gray-500">အတည်ပြုပြီးသော ဂေဟာများအားလုံးကို ကြည့်ရှုပါ</p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="ဂေဟာ ရှာဖွေရန်..."
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

        {/* Shelters Grid */}
        {filteredShelters.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <p className="text-gray-500">
              {searchQuery ? "ရှာဖွေမှု ရလဒ် မတွေ့ပါ" : "အတည်ပြုပြီးသော ဂေဟာ မရှိသေးပါ"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredShelters.map((shelter) => (
              <Link
                key={shelter._id}
                href={`/shelters/${shelter._id}`}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl hover:border-blue-200 transition group"
              >
                {/* Image or Initials */}
                <div className="h-40 bg-gradient-to-br from-blue-100 to-purple-100 relative">
                  {shelter.profileImages?.[0] ? (
                    <img
                      src={shelter.profileImages[0]}
                      alt={shelter.hostelName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-4xl font-bold text-blue-400">
                        {getInitials(shelter.hostelName)}
                      </span>
                    </div>
                  )}
                  {/* Verified badge */}
                  <span className="absolute top-3 right-3 bg-green-500 text-white text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    အတည်ပြုပြီး
                  </span>
                </div>

                {/* Info */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition truncate">
                        {shelter.hostelName}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {shelter.city}
                      </p>
                    </div>
                    {/* Reliability Score Badge - always visible */}
                    <div className="flex-shrink-0 bg-blue-50 rounded-lg px-2 py-1 text-center min-w-[3rem]">
                      <p className="text-xs text-blue-600 font-medium">
                        {Number(shelter.reliabilityScore?.given) ?? 0}/{Number(shelter.reliabilityScore?.total) ?? 0}
                      </p>
                      <p className="text-[10px] text-blue-400">ယုံကြည်စိတ်ချရမှု</p>
                    </div>
                  </div>

                  {/* Population stats */}
                  {(shelter.population?.adults > 0 || shelter.population?.children > 0) && (
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
                      {shelter.population?.adults > 0 && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {shelter.population.adults} အရွယ်ရောက်ပြီးသူ
                        </div>
                      )}
                      {shelter.population?.children > 0 && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                          {shelter.population.children} ကလေး
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Total count */}
        {filteredShelters.length > 0 && (
          <p className="text-center text-sm text-gray-400 mt-8">
            စုစုပေါင်း ဂေဟာ {filteredShelters.length} ခု
          </p>
        )}
      </div>
    </div>
  );
}
