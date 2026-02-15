"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<{ id?: string; name?: string; email?: string; profilePhoto?: string } | null>(null);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [certLoading, setCertLoading] = useState(false);

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

        // Fetch certificates
        setCertLoading(true);
        const certRes = await fetch('/api/profile/certificates');
        const certJson = await certRes.json();
        if (certJson?.ok && Array.isArray(certJson.certificates)) {
          setCertificates(certJson.certificates);
        }
      } catch (e) {
        console.error('Profile load error:', e);
        router.push('/auth/login');
      } finally {
        if (mounted) {
          setLoading(false);
          setCertLoading(false);
        }
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
          {certLoading ? (
            <div className="text-sm text-gray-600">Loading certificates…</div>
          ) : certificates.length === 0 ? (
            <div className="rounded border-dashed border-2 border-gray-200 p-6 text-center text-sm text-gray-600">
              <div className="mb-2">No certificates available yet.</div>
              <div className="text-xs text-gray-500">Certificates are issued/approved by the admin and will appear here when available.</div>
            </div>
          ) : (
            <div className="space-y-3">
              {certificates.map((cert: any) => (
                <div key={cert.id || cert._id} className="rounded border border-gray-200 p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{cert.certificateNo}</div>
                    <div className="text-xs text-gray-600">
                      {cert.type} • Issued {new Date(cert.issuedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <a
                    href={cert.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded bg-black text-white px-4 py-2 text-sm font-medium hover:bg-gray-800"
                  >
                    View PDF
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
