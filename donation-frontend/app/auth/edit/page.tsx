"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function EditProfile() {
  const router = useRouter();
  const [profile, setProfile] = useState<{ id?: string; name?: string; email?: string; profilePhoto?: string } | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

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
        setName(json.profile.name || "");
        setEmail(json.profile.email || "");
      } catch (e) {
        router.push('/auth/login');
      }
    }
    load();
    return ()=>{ mounted = false };
  }, []);

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!profile?.id) return alert('Missing account');
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/edit', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: profile.id, name, email, password: password || undefined, profilePhoto: profile?.profilePhoto }),
      });
      const json = await res.json();
      if (res.ok && json.profile) {
        try { sessionStorage.setItem('donorAccount', JSON.stringify(json.profile)); } catch (e) {}
        alert('Profile updated');
        router.push('/');
      } else {
        alert(json.error || 'Update failed');
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
      <form onSubmit={handleUpdate} className="w-full max-w-md rounded-xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold mb-4">Edit profile</h1>
        <label className="block text-sm font-medium text-gray-700">Name</label>
        <input value={name} onChange={(e)=>setName(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" />

        <label className="block text-sm font-medium text-gray-700 mt-4">Email</label>
        <input value={email} onChange={(e)=>setEmail(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" type="email" />

        <label className="block text-sm font-medium text-gray-700 mt-4">New password (leave blank to keep)</label>
        <input value={password} onChange={(e)=>setPassword(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" type="password" />

        <label className="block text-sm font-medium text-gray-700 mt-4">Profile photo (optional)</label>
        <input type="file" accept="image/*" onChange={async (e)=>{
          const f = e.target.files?.[0];
          if (!f) return;
          setUploading(true);
          try {
            const reader = new FileReader();
            reader.onload = async () => {
              const dataUrl = String(reader.result);
              const res = await fetch('/api/auth/upload', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ filename: f.name, data: dataUrl }) });
              const json = await res.json();
              if (res.ok && json.url) setProfile({ ...(profile||{}), profilePhoto: json.url });
              else alert(json.error || 'Upload failed');
            };
            reader.readAsDataURL(f);
          } catch (err) {
            console.error(err);
            alert('Upload error');
          } finally { setUploading(false); }
        }} className="mt-1 w-full" />
        {uploading ? <div className="text-sm text-gray-500 mt-2">Uploading…</div> : profile?.profilePhoto ? <img src={profile.profilePhoto} alt="preview" className="mt-2 w-16 h-16 rounded-full object-cover"/> : null}

        <div className="mt-6 flex gap-3">
          <button type="submit" disabled={isLoading} className="w-full rounded-lg bg-black text-white px-4 py-2">{isLoading ? 'Saving…' : 'Save'}</button>
          <button type="button" onClick={()=>router.push('/')} className="w-full rounded-lg border px-4 py-2">Cancel</button>
        </div>
      </form>
    </main>
  );
}
