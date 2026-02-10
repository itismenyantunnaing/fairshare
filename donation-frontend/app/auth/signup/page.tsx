"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profilePhoto, setProfilePhoto] = useState("");
  const [uploading, setUploading] = useState(false);
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return alert("Email and password required");
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, profilePhoto }),
      });
      const json = await res.json();
      if (res.ok) {
        // server set HttpOnly cookie; just navigate to home and let AuthNav fetch session
        router.push('/');
      } else {
        alert(json.error || 'Signup failed');
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
      <form onSubmit={handleSignup} className="w-full max-w-md rounded-xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold mb-4">Create account</h1>
        <label className="block text-sm font-medium text-gray-700">Name</label>
        <input value={name} onChange={(e)=>setName(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" />

        <label className="block text-sm font-medium text-gray-700 mt-4">Email</label>
        <input value={email} onChange={(e)=>setEmail(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" type="email" />

        <label className="block text-sm font-medium text-gray-700 mt-4">Password</label>
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
              if (res.ok && json.url) setProfilePhoto(json.url);
              else alert(json.error || 'Upload failed');
            };
            reader.readAsDataURL(f);
          } catch (err) {
            console.error(err);
            alert('Upload error');
          } finally { setUploading(false); }
        }} className="mt-1 w-full" />
        {uploading ? <div className="text-sm text-gray-500 mt-2">Uploading…</div> : profilePhoto ? <img src={profilePhoto} alt="preview" className="mt-2 w-16 h-16 rounded-full object-cover"/> : null}

        <button type="submit" disabled={isLoading} className="mt-6 w-full rounded-lg bg-black text-white px-4 py-2">
          {isLoading ? 'Creating…' : 'Create account'}
        </button>

        <p className="mt-4 text-sm text-gray-600">Already have an account? <a href="/auth/login" className="text-blue-600">Log in</a></p>
      </form>
    </main>
  );
}
