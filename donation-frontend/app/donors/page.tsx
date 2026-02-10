"use client";

import { useEffect, useState } from "react";

export default function DonorsPage() {
  const [donors, setDonors] = useState<Array<{id:string;name:string|null;email:string;profilePhoto?:string}>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');

  // debounce search
  useEffect(()=>{
    const t = setTimeout(()=> setDebouncedQ(q.trim()), 300);
    return ()=> clearTimeout(t);
  },[q]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const url = '/api/donors' + (debouncedQ ? `?q=${encodeURIComponent(debouncedQ)}` : '');
        const res = await fetch(url);
        const json = await res.json();
        if (!mounted) return;
        if (!res.ok) {
          setError(json.error || 'Failed to load');
          setDonors([]);
        } else {
          setDonors(json.donors || []);
          setError(null);
        }
      } catch (e:any) {
        setError('Server error');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return ()=>{ mounted = false };
  }, [debouncedQ]);

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-lg p-6 shadow-sm">
        <h1 className="text-2xl font-semibold mb-4">Donors</h1>

        <div className="mb-4 flex gap-2">
          <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search name or email" className="flex-1 rounded border px-3 py-2" />
          <button onClick={()=>setQ('')} className="rounded border px-3 py-2">Clear</button>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading…</div>
        ) : error ? (
          <div className="text-center text-red-600">{error}</div>
        ) : donors.length === 0 ? (
          <div className="text-gray-600">No donors found.</div>
        ) : (
          <ul className="space-y-3">
            {donors.map(d => (
              <li key={d.id} className="p-3 border rounded flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <img src={d.profilePhoto || '/default-avatar.svg'} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <div className="font-medium">{d.name ?? '—'}</div>
                    <div className="text-sm text-gray-600">{d.email}</div>
                  </div>
                </div>
                <a href={`/donors/${d.id}`} className="text-sm text-blue-600">View</a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
