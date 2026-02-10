"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ThanksPage() {
  const router = useRouter();

  useEffect(() => {
    // clear pending donation data
    try {
      sessionStorage.removeItem("pendingDonation");
      sessionStorage.removeItem("paymentResult");
    } catch (e) {
      // ignore
    }
  }, []);

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <a href="/" className="text-lg font-semibold">DonateNow</a>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Thank you!</h1>
        <p className="mt-4 text-gray-600">We appreciate your support. Your donation is being processed.</p>

        <div className="mt-8">
          <button
            onClick={() => router.push("/")}
            className="rounded-xl bg-black px-6 py-3 text-sm font-medium text-white hover:bg-gray-800"
          >
            Return Home
          </button>
        </div>
      </section>
    </main>
  );
}
