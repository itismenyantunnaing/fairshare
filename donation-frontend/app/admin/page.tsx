"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function CardButton({
  title,
  desc,
  onClick,
}: {
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-3xl border bg-white p-6 text-left shadow-sm transition hover:bg-gray-50"
    >
      <div className="text-lg font-semibold text-gray-900">{title}</div>
      <div className="mt-1 text-sm text-gray-600">{desc}</div>
      <div className="mt-4 inline-flex rounded-xl bg-black px-4 py-2 text-xs font-semibold text-white">
        Open
      </div>
    </button>
  );
}

export default function AdminHomePage() {
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);

  // same guard pattern you already use
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
        <div className="mb-8">
          <p className="text-sm text-gray-500">Fair Sharing</p>
          <h1 className="text-2xl font-semibold text-gray-900">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">
            Choose a section to review and manage requests.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <CardButton
            title="Donor Requests"
            desc="Review pending donations/support requests. Approve or decline."
            onClick={() => router.push("/admin/donor-requests")}
          />

          <CardButton
            title="Hostel Onboarding Requests"
            desc="Approve/decline hostel onboarding applications. (Coming next)"
            onClick={() => router.push("/admin/hostel-requests")}
          />
        </div>
      </div>
    </main>
  );
}
