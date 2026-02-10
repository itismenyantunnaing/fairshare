"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

async function fetchSession() {
    try {
        const res = await fetch('/api/auth/session');
        if (!res.ok) return null;
        const json = await res.json();
        return json.ok ? json.profile : null;
    } catch (e) {
        return null;
    }
}

export default function AuthNav() {
    const router = useRouter();
    const [profile, setProfile] = useState<{ id?: string; name?: string; email?: string; profilePhoto?: string } | null>(null);

    useEffect(() => {
        let mounted = true;
        fetchSession().then(p => { if (mounted) setProfile(p); }).catch(() => { });
        return () => { mounted = false };
    }, []);

    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        function onDoc(e: MouseEvent) {
            if (!ref.current) return;
            if (!(e.target instanceof Node)) return;
            if (!ref.current.contains(e.target)) setOpen(false);
        }
        document.addEventListener('click', onDoc);
        return () => document.removeEventListener('click', onDoc);
    }, []);

    function logout() {
        fetch('/api/auth/logout', { method: 'POST' }).finally(() => {
            setProfile(null);
            router.push('/');
        });
    }

    return (
        <nav className="flex gap-4 text-sm text-gray-600 items-center">
            <a className="hover:text-gray-900" href="#causes">Causes</a>
            <a className="hover:text-gray-900" href="#how">How it works</a>
            <a className="hover:text-gray-900" href="/donate">Donate</a>
            <a className="text-sm text-gray-600 hover:text-gray-900" href="/donors">Donors</a>


            <div className="ml-4 h-6 border-l border-gray-200" />

            {profile ? (
                <div className="flex items-center gap-3" ref={ref}>
                    <button onClick={() => setOpen(v => !v)} className="flex items-center gap-2">
                        <img src={profile.profilePhoto || '/default-avatar.svg'} alt="avatar" className="w-7 h-7 rounded-full object-cover" />
                        <span className="text-sm text-gray-800">{profile.name ?? profile.email}</span>
                    </button>

                    {open && (
                        <div className="absolute right-4 mt-12 w-44 bg-white border rounded shadow-sm py-1">
                            <a href="/auth/profile" className="block px-3 py-2 text-sm hover:bg-gray-50">View profile</a>
                            <button onClick={logout} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50">Logout</button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex items-center gap-3">
                    <a className="hover:text-gray-900" href="/auth/login">Login</a>
                    <a className="rounded-lg border border-gray-300 px-3 py-1 hover:bg-gray-50" href="/auth/signup">Sign up</a>
                </div>
            )}
        </nav>
    );
}
