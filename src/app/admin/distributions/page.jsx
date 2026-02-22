"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Distributions are now a tab on the admin dashboard.
 * Redirect to dashboard with distributions tab selected.
 */
export default function AdminDistributionsPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin?tab=distributions");
  }, [router]);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex items-center justify-center">
      <div className="text-center text-gray-500">
        <p>ဖြန့်ဝေမှု စီမံခန့်ခွဲရန် သို့ ပြန်ညွှန်းနေသည်...</p>
      </div>
    </div>
  );
}
