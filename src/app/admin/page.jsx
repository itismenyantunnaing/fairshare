"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AdminHostelsSection from "./AdminHostelsSection";
import AdminDonationsSection from "./AdminDonationsSection";
import AdminDistributionsSection from "./AdminDistributionsSection";

const SECTION_TABS = [
  { key: "hostels", label: "ခိုလှုံရာအိမ်များ" },
  { key: "donations", label: "အလှူငွေများ" },
  { key: "distributions", label: "ဖြန့်ဝေမှုများ" },
];

export default function AdminPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authChecked, setAuthChecked] = useState(false);
  const [mainTab, setMainTab] = useState(() => {
    const t = searchParams.get("tab");
    return t === "donations" || t === "distributions" ? t : "hostels";
  });

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "donations" || tab === "hostels" || tab === "distributions") setMainTab(tab);
  }, [searchParams]);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.success && data.user && (data.user.role === "admin" || data.user.role === "super_admin")) {
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

  if (!authChecked) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">စစ်ဆေးနေသည်...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">စီမံခန့်ခွဲရန်</h1>

        <div className="flex gap-1 bg-white p-1 rounded-lg border border-gray-200 w-fit mb-6">
          {SECTION_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setMainTab(tab.key);
                const url = tab.key === "hostels" ? "/admin" : `/admin?tab=${tab.key}`;
                router.replace(url, { scroll: false });
              }}
              className={`px-5 py-2.5 rounded-md text-sm font-medium transition ${
                mainTab === tab.key
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {mainTab === "hostels" && <AdminHostelsSection />}
        {mainTab === "donations" && <AdminDonationsSection />}
        {mainTab === "distributions" && <AdminDistributionsSection />}
      </div>
    </div>
  );
}
