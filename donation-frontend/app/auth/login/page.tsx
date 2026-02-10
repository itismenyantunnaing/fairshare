"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return alert('Email and password required');
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (res.ok && json.profile) {
        // server set HttpOnly cookie; navigate to home and let AuthNav fetch session
        router.push('/');
      } else {
        alert(json.error || 'Login failed');
      }
    } catch (err) {
      console.error(err);
      alert('Server error');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <form onSubmit={handleLogin} className="w-full max-w-md rounded-xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold mb-4">Login</h1>

        <label className="block text-sm font-medium text-gray-700">Email</label>
        <input value={email} onChange={(e)=>setEmail(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" type="email" />

        <label className="block text-sm font-medium text-gray-700 mt-4">Password</label>
        <input value={password} onChange={(e)=>setPassword(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" type="password" />
        <button type="submit" disabled={isLoading} className="mt-6 w-full rounded-lg bg-black text-white px-4 py-2">
          {isLoading ? 'Signing in…' : 'Sign in'}
        </button>

        <p className="mt-4 text-sm text-gray-600">Don’t have an account? <a href="/auth/signup" className="text-blue-600">Sign up</a></p>
      </form>
    </main>
  );
}
