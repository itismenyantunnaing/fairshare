"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("/api/auth/session");
        const data = await res.json();
        if (data?.ok) {
          router.replace("/api/admin");
          return;
        }
      } catch (err) {
        console.error("Admin login session check failed", err);
      } finally {
        setCheckingSession(false);
      }
    };
    checkSession();
  }, [router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        setError(data?.error || "Login failed. Please try again.");
        return;
      }
      router.replace("/api/admin");
    } catch (err) {
      console.error("Admin login failed", err);
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="rounded-2xl border bg-white px-6 py-4 text-sm text-gray-600 shadow-sm">
          Checking session...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto flex min-h-screen max-w-lg items-center px-4 py-10">
        <div className="w-full rounded-3xl border bg-white p-8 shadow-sm">
          <div className="mb-6">
            <p className="text-sm text-gray-500">Admin access</p>
            <h1 className="text-2xl font-semibold text-gray-900">Sign in</h1>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-2 text-sm focus:border-gray-900 focus:outline-none"
                placeholder="admin@example.com"
                required
              />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-2 text-sm focus:border-gray-900 focus:outline-none"
                placeholder="••••••••"
                required
              />
            </label>
            {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div> : null}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
          <p className="mt-6 text-xs text-gray-500">
            This login uses the existing donor authentication flow and session cookie.
          </p>
        </div>
      </div>
    </main>
  );
}
