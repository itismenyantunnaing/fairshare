"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function HostelRequestsPage() {
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/session", { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!data?.ok) {
          router.replace("/admin/login");
          return;
        }
      } catch {
        router.replace("/admin/login");
        return;
      } finally {
        setCheckingSession(false);
      }
    })();
  }, [router]);

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="rounded-2xl border bg-white px-6 py-4 text-sm text-gray-600 shadow-sm">
          Checking admin session...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Fair Sharing</p>
            <h1 className="text-2xl font-semibold text-gray-900">Hostel Onboarding Requests</h1>
            <p className="mt-1 text-sm text-gray-600">
              This page will list hostels waiting for admin approval.
            </p>
          </div>

          <button
            onClick={() => router.push("/admin")}
            className="rounded-xl border bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100"
          >
            Back to Dashboard
          </button>
        </div>

        <div className="rounded-3xl border bg-white p-6 text-sm text-gray-600 shadow-sm">
          Coming next: hostel onboarding approval table.
        </div>
      </div>
    </main>
  );
}
