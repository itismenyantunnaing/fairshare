"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<{ id?: string; name?: string; email?: string; profilePhoto?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch('/api/auth/session');
        const json = await res.json();
        if (!json?.profile) {
          router.push('/auth/login');
          return;
        }
        if (!mounted) return;
        setProfile(json.profile);
      } catch (e) {
        router.push('/auth/login');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return ()=>{ mounted = false };
  }, []);

  if (loading) return <main className="min-h-screen flex items-center justify-center">Loading…</main>;
  if (!profile) return null;

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-md overflow-hidden">
        <div className="relative w-full h-56 bg-gray-200">
          <img src={profile.profilePhoto || '/default-avatar.svg'} alt="profile" className="w-full h-full object-cover" />
          <div className="absolute left-4 bottom-4 bg-black bg-opacity-60 text-white px-4 py-2 rounded">
            <div className="font-semibold">{profile.name ?? '—'}</div>
            <div className="text-sm opacity-90">{profile.email}</div>
          </div>
        </div>

        <div className="p-6">
          <h2 className="text-lg font-medium mb-3">Info</h2>
          <div className="grid grid-cols-1 gap-3 text-sm text-gray-700">
            <div className="flex justify-between">
              <div className="font-medium">Name</div>
              <div>{profile.name ?? '—'}</div>
            </div>
            <div className="flex justify-between">
              <div className="font-medium">Email</div>
              <div>{profile.email}</div>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button onClick={()=>router.push('/auth/edit')} className="rounded-lg bg-black text-white px-4 py-2">Edit profile</button>
            <button onClick={()=>router.push('/')} className="rounded-lg border px-4 py-2">Close</button>
          </div>
        </div>

        <div className="p-6 border-t">
          <h2 className="text-lg font-medium mb-3">Certificates</h2>
          <div className="rounded border-dashed border-2 border-gray-200 p-6 text-center text-sm text-gray-600">
            <div className="mb-2">No certificates available yet.</div>
            <div className="text-xs text-gray-500">Certificates are issued/approved by the admin and will appear here when available.</div>
          </div>
        </div>
      </div>
    </main>
  );
}
