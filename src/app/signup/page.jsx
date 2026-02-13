"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState(null);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">အကောင့်ဖွင့်ရန်</h1>
          <p className="text-gray-500 mt-2 text-sm">
            သင့်အကောင့် အမျိုးအစားကို ရွေးချယ်ပါ
          </p>
        </div>

        <div className="space-y-4">
          {/* Donor Option */}
          <button
            onClick={() => setSelectedType("donor")}
            className={`w-full bg-white rounded-2xl border-2 p-6 text-left transition hover:shadow-md ${
              selectedType === "donor"
                ? "border-purple-400 ring-2 ring-purple-100"
                : "border-gray-200"
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">အလှူရှင်</h3>
                <p className="text-sm text-gray-500 mt-1">
                  ကလေးများခိုလှုံရာအိမ်များသို့ လှူဒါန်းရန်
                </p>
              </div>
            </div>
          </button>

          {/* Shelter Option */}
          <button
            onClick={() => setSelectedType("shelter")}
            className={`w-full bg-white rounded-2xl border-2 p-6 text-left transition hover:shadow-md ${
              selectedType === "shelter"
                ? "border-blue-400 ring-2 ring-blue-100"
                : "border-gray-200"
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">ခိုလှုံရာအိမ်</h3>
                <p className="text-sm text-gray-500 mt-1">
                  ခိုလှုံရာအိမ်ကို မှတ်ပုံတင်ပြီး အလှူငွေ လက်ခံရန်
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Action area */}
        {selectedType === "donor" && (
          <div className="mt-6 bg-purple-50 border border-purple-200 rounded-xl p-5 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-purple-900">မကြာမီ လာမည်</h3>
            <p className="text-sm text-purple-700 mt-1">
              အလှူရှင် အကောင့်ကို မကြာမီ ဖွင့်လှစ်ပေးပါမည်။ ကျေးဇူးပြု၍ စောင့်ဆိုင်းပေးပါ။
            </p>
          </div>
        )}

        {selectedType === "shelter" && (
          <div className="mt-6">
            <button
              onClick={() => router.push("/onboarding")}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition"
            >
              ခိုလှုံရာအိမ် မှတ်ပုံတင်ရန်
            </button>
          </div>
        )}

        <p className="text-center text-sm text-gray-500 mt-6">
          အကောင့် ရှိပြီးသားလား?{" "}
          <Link href="/login" className="text-blue-600 hover:text-blue-800 font-medium">
            အကောင့်ဝင်ရန်
          </Link>
        </p>
      </div>
    </div>
  );
}
