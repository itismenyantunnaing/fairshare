"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.success && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      setMenuOpen(false);
      router.push("/");
      router.refresh();
    } catch {
      // ignore
    }
  };

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";
  const isSuperAdmin = user?.role === "super_admin";
  const isShelter = user?.role === "shelter";
  const isApproved = user?.status === "approved";
  const displayName = isAdmin ? user?.name : user?.hostelName;
  const profileImage = user?.profileImage;

  // Get initials from name (first 2 characters or first letters of words)
  const getInitials = (name) => {
    if (!name) return "?";
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };
  const initials = getInitials(displayName);

  // Helper for active link styling
  const isActive = (path) => pathname?.startsWith(path);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xl font-bold text-blue-600">FairShare</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden sm:flex items-center gap-1">
            {/* Public Shelters link - visible to everyone */}
            <Link
              href="/shelters"
              className={`text-sm font-medium px-3 py-2 rounded-lg transition ${
                isActive("/shelters") && !isActive("/shelter/")
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              ခိုလှုံရာအိမ်များ
            </Link>

            {loading ? (
              <div className="w-8 h-8 bg-gray-100 rounded-full animate-pulse ml-2" />
            ) : user ? (
              isAdmin ? (
                /* ─── Admin Nav ─── */
                <div className="flex items-center gap-1">
                  <Link
                    href="/admin/hostels"
                    className={`text-sm font-medium px-3 py-2 rounded-lg transition ${
                      isActive("/admin/hostels")
                        ? "text-blue-600 bg-blue-50"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    စီမံခန့်ခွဲရန်
                  </Link>
                  <Link
                    href="#"
                    className="text-sm font-medium px-3 py-2 rounded-lg text-gray-400 cursor-not-allowed"
                    onClick={(e) => e.preventDefault()}
                  >
                    အလှူရှင်များ
                  </Link>
                  {isSuperAdmin && (
                    <Link
                      href="/admin/manage"
                      className={`text-sm font-medium px-3 py-2 rounded-lg transition ${
                        isActive("/admin/manage")
                          ? "text-blue-600 bg-blue-50"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                    >
                      စီမံခန့်ခွဲသူများ
                    </Link>
                  )}
                  <div className="w-px h-6 bg-gray-200 mx-2" />
                  <span className="text-sm text-gray-500 mr-1">{displayName}</span>
                  <button
                    onClick={handleLogout}
                    className="text-sm text-gray-500 hover:text-red-600 font-medium px-3 py-2 rounded-lg hover:bg-red-50 transition"
                  >
                    ထွက်ရန်
                  </button>
                </div>
              ) : (
                /* ─── Shelter / Donor Nav ─── */
                <Link href={isShelter ? `/shelter/${user.id}` : "#"} className="flex items-center gap-2 ml-2">
                  <div className="relative">
                    {profileImage ? (
                      <img
                        src={profileImage}
                        alt={displayName}
                        className="w-9 h-9 rounded-full object-cover border-2 border-gray-200 hover:border-blue-300 transition"
                      />
                    ) : (
                      <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center hover:from-blue-600 hover:to-purple-700 transition cursor-pointer">
                        <span className="text-sm font-bold text-white">{initials}</span>
                      </div>
                    )}
                    {/* Verified badge indicator */}
                    {isApproved && isShelter && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </span>
                    )}
                  </div>
                </Link>
              )
            ) : (
              /* ─── Logged Out ─── */
              <div className="flex items-center gap-2 ml-2">
                <Link
                  href="/login"
                  className="text-sm text-gray-600 hover:text-gray-900 font-medium px-4 py-2 rounded-lg hover:bg-gray-50 transition"
                >
                  အကောင့်ဝင်ရန်
                </Link>
                <Link
                  href="/signup"
                  className="text-sm text-white bg-blue-600 hover:bg-blue-700 font-medium px-4 py-2 rounded-lg transition"
                >
                  အကောင့်ဖွင့်ရန်
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="sm:hidden p-2 text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="sm:hidden pb-4 border-t border-gray-100 pt-3 space-y-1">
            {/* Public Shelters link - visible to everyone */}
            <Link
              href="/shelters"
              onClick={() => setMenuOpen(false)}
              className={`block text-sm font-medium px-3 py-2.5 rounded-lg ${
                isActive("/shelters") && !isActive("/shelter/")
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              ခိုလှုံရာအိမ်များ
            </Link>
            <div className="border-t border-gray-100 my-1" />

            {loading ? null : user ? (
              isAdmin ? (
                /* ─── Admin Mobile ─── */
                <>
                  <p className="text-xs text-gray-400 px-3 pb-1 uppercase tracking-wide">
                    {displayName} · {isSuperAdmin ? "Super Admin" : "Admin"}
                  </p>
                  <Link
                    href="/admin/hostels"
                    onClick={() => setMenuOpen(false)}
                    className={`block text-sm font-medium px-3 py-2.5 rounded-lg ${
                      isActive("/admin/hostels")
                        ? "text-blue-600 bg-blue-50"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    စီမံခန့်ခွဲရန်
                  </Link>
                  <span className="block text-sm font-medium px-3 py-2.5 text-gray-400">
                    အလှူရှင်များ
                  </span>
                  {isSuperAdmin && (
                    <Link
                      href="/admin/manage"
                      onClick={() => setMenuOpen(false)}
                      className={`block text-sm font-medium px-3 py-2.5 rounded-lg ${
                        isActive("/admin/manage")
                          ? "text-blue-600 bg-blue-50"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      စီမံခန့်ခွဲသူများ
                    </Link>
                  )}
                  <div className="border-t border-gray-100 my-1" />
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left text-sm text-red-600 font-medium px-3 py-2.5 rounded-lg hover:bg-red-50"
                  >
                    ထွက်ရန်
                  </button>
                </>
              ) : (
                /* ─── Shelter / Donor Mobile ─── */
                <>
                  <Link
                    href={isShelter ? `/shelter/${user.id}` : "#"}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50"
                  >
                    <div className="relative">
                      {profileImage ? (
                        <img
                          src={profileImage}
                          alt={displayName}
                          className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-white">{initials}</span>
                        </div>
                      )}
                      {/* Verified badge indicator */}
                      {isApproved && isShelter && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                          <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium text-gray-900">{displayName}</p>
                        {isApproved && isShelter && (
                          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">ပရိုဖိုင် ကြည့်ရန်</p>
                    </div>
                  </Link>
                  <div className="border-t border-gray-100 my-1" />
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left text-sm text-red-600 font-medium px-3 py-2.5 rounded-lg hover:bg-red-50"
                  >
                    ထွက်ရန်
                  </button>
                </>
              )
            ) : (
              /* ─── Logged Out Mobile ─── */
              <>
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="block text-sm text-gray-700 font-medium px-3 py-2.5 rounded-lg hover:bg-gray-50"
                >
                  အကောင့်ဝင်ရန်
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMenuOpen(false)}
                  className="block text-sm text-blue-600 font-medium px-3 py-2.5 rounded-lg hover:bg-blue-50"
                >
                  အကောင့်ဖွင့်ရန်
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
