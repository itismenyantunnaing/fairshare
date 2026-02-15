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
        <nav className="flex gap-1 items-center">
            <a 
                className="px-4 py-2 text-sm font-medium text-white hover:text-emerald-100 hover:bg-white/10 rounded-lg transition-all" 
                href="/donate"
            >
                Donate
            </a>
            <a 
                className="px-4 py-2 text-sm font-medium text-white hover:text-emerald-100 hover:bg-white/10 rounded-lg transition-all" 
                href="#causes"
            >
                Causes
            </a>
            <a 
                className="px-4 py-2 text-sm font-medium text-white hover:text-emerald-100 hover:bg-white/10 rounded-lg transition-all" 
                href="#how"
            >
                How it works
            </a>
            
            <a 
                className="px-4 py-2 text-sm font-medium text-white hover:text-emerald-100 hover:bg-white/10 rounded-lg transition-all" 
                href="/donors"
            >
                Donors
            </a>

            <div className="ml-2 h-6 border-l border-white/30" />

            {profile ? (
                <div className="flex items-center gap-3" ref={ref}>
                    <button 
                        onClick={() => setOpen(v => !v)} 
                        className="flex items-center gap-2 px-2 py-1 hover:bg-white/10 rounded-lg transition-all"
                    >
                        <img 
                            src={profile.profilePhoto || '/default-avatar.svg'} 
                            alt="avatar" 
                            className="w-8 h-8 rounded-full object-cover border-2 border-white" 
                        />
                        <span className="text-sm font-medium text-white">{profile.name ?? profile.email}</span>
                    </button>

                    {open && (
                        <div className="absolute right-4 mt-12 w-48 bg-white border border-gray-100 rounded-xl shadow-lg shadow-gray-200/50 py-2 overflow-hidden">
                            <a 
                                href="/auth/profile" 
                                className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 font-medium"
                            >
                                View profile
                            </a>
                            <button 
                                onClick={logout} 
                                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 font-medium"
                            >
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex items-center gap-2 ml-2">
                    <a 
                        className="px-4 py-2 text-sm font-medium text-white hover:text-emerald-100 hover:bg-white/10 rounded-lg transition-all" 
                        href="/auth/login"
                    >
                        Login
                    </a>
                    <a 
                        className="px-4 py-2 text-sm font-medium text-emerald-600 bg-white rounded-lg shadow-md transition-all hover:scale-105" 
                        href="/auth/signup"
                    >
                        Sign up
                    </a>
                </div>
            )}
        </nav>
    );
}

