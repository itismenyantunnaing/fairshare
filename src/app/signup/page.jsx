"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleDonorSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    if (password !== confirmPassword) {
      setError("စကားဝှက် နှစ်ကြိမ် ကိုက်ညီပါစေ။");
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/auth/donor/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (data.success) {
        router.push("/donor");
        router.refresh();
      } else {
        setError(data.error);
      }
    } catch {
      setError("ကွန်ရက်ချို့ယွင်းချက်ဖြစ်ပါသည်။ ထပ်မံကြိုးစားပါ။");
    } finally {
      setLoading(false);
    }
  };

  const resetDonorForm = () => {
    setError(null);
    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  };

  const handleBack = () => {
    setSelectedType(null);
    resetDonorForm();
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full">
        {selectedType === null && (
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">အကောင့်ဖွင့်ရန်</h1>
            <p className="text-gray-500 mt-2 text-sm">
              သင့်အကောင့် အမျိုးအစားကို ရွေးချယ်ပါ
            </p>
          </div>
        )}

        {selectedType === null ? (
          <div className="space-y-4">
            <button
              onClick={() => setSelectedType("donor")}
              className="w-full bg-white rounded-2xl border-2 border-gray-200 p-6 text-left transition hover:shadow-md hover:border-purple-200"
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

            <button
              onClick={() => router.push("/onboarding")}
              className="w-full bg-white rounded-2xl border-2 border-gray-200 p-6 text-left transition hover:shadow-md hover:border-blue-200"
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
        ) : selectedType === "donor" ? (
          <>
            {/* Back to account type selection - outside form card, same as shelter */}
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              အမျိုးအစား ပြန်ရွေးရန်
            </button>
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">အလှူရှင် အကောင့်ဖွင့်ရန်</h2>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-5">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}
              <form onSubmit={handleDonorSubmit} className="space-y-5">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  အမည် <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="သင့်အမည် ထည့်သွင်းပါ"
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  အီးမေးလ် <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ဥပမာ - donor@example.com"
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  စကားဝှက် <span className="text-red-500">*</span> (အနည်းဆုံး ၆ လုံး)
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="စကားဝှက် ထည့်သွင်းပါ"
                  required
                  minLength={6}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  စကားဝှက် ထပ်ထည့်ပါ
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="စကားဝှက် ပြန် ထည့်သွင်းပါ"
                  required
                  minLength={6}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-lg font-semibold text-white transition ${
                  loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
                }`}
              >
                {loading ? "အကောင့်ဖွင့်နေသည်..." : "အကောင့်ဖွင့်ရန်"}
              </button>
            </form>
            </div>
          </>
        ) : null}

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
