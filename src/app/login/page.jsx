"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/context/ToastContext";

export default function LoginPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (data.success) {
        const role = data.role;
        if (role === "super_admin" || role === "admin") {
          router.push("/admin");
        } else if (role === "donor") {
          router.push("/donor");
        } else {
          router.push(`/shelter/${data.id}`);
        }
        router.refresh();
      } else {
        showToast(data.error, "error");
      }
    } catch {
      showToast("ကွန်ရက်ချို့ယွင်းချက်ဖြစ်ပါသည်။ ထပ်မံကြိုးစားပါ။", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">အကောင့်ဝင်ရန်</h1>
          <p className="text-gray-500 mt-2 text-sm">
            သင့်အကောင့်သို့ ဝင်ရောက်ပါ
          </p>
          <p className="text-gray-400 mt-1 text-xs">
            အလှူရှင် · ဂေဟာ · စီမံခန့်ခွဲသူ အားလုံး ဤနေရာတွင် ဝင်ရောက်ပါ။
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                အီးမေးလ်
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ဥပမာ - contact@shelter.com"
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                စကားဝှက်
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="စကားဝှက် ထည့်သွင်းပါ"
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg font-semibold text-white transition ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  ဝင်ရောက်နေသည်...
                </span>
              ) : (
                "အကောင့်ဝင်ရန်"
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            အကောင့် မရှိသေးဘူးလား?{" "}
            <Link href="/signup" className="text-blue-600 hover:text-blue-800 font-medium">
              အကောင့်ဖွင့်ရန်
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
