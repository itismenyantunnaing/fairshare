"use client";
import { useState, useEffect } from "react";
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
  return x.toLocaleDateString("my-MM", { day: "numeric", month: "short", year: "numeric" });
}

export default function DistributionsListPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [distributions, setDistributions] = useState([]);
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
    if (!authChecked) return;
    const fetchList = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/distributions");
        const data = await res.json();
        if (data.success) setDistributions(data.distributions || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchList();
  }, [authChecked]);

  if (!authChecked) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">ဖြန့်ဝေမှုများ</h1>
        <p className="text-gray-600 text-sm mb-6">
          ဖြန့်ဝေမှုတစ်ခုကို နှိပ်ပြီး ထိုဖြန့်ဝေမှုနှင့် ဆိုင်သော လှုပ်ရှားမှုများ (ပို့စ်များ) ကြည့်နိုင်ပါသည်။
        </p>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full" />
          </div>
        ) : distributions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <p className="text-gray-500">ဖြန့်ဝေမှု မရှိသေးပါ။</p>
          </div>
        ) : (
          <div className="space-y-3">
            {distributions.map((d) => (
              <Link
                key={d.id}
                href={`/distributions/${d.id}`}
                className="block bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-200 hover:shadow-md transition"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="font-semibold text-gray-900">
                      {d.name || "ဖြန့်ဝေမှု"}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {SCHEDULE_LABEL[d.scheduleType] || d.scheduleType}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      အလှူကာလ: {formatDate(d.donationPeriodStart)} — {formatDate(d.donationPeriodEnd)}
                    </p>
                  </div>
                  <span className="text-blue-600 text-sm font-medium flex-shrink-0">
                    ကြည့်ရန် →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
