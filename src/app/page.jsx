import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4">
      <div className="text-center max-w-lg">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          FairShare
        </h1>
        <p className="text-gray-500 mb-10">
          Hostel Management Platform
        </p>

        <div className="space-y-4">
          <Link
            href="/onboarding"
            className="block w-full bg-blue-600 text-white py-3.5 px-6 rounded-xl font-semibold hover:bg-blue-700 transition shadow-sm"
          >
            Register Your Hostel
          </Link>

          <Link
            href="/admin/hostels"
            className="block w-full bg-white text-gray-700 py-3.5 px-6 rounded-xl font-semibold hover:bg-gray-50 transition border border-gray-200 shadow-sm"
          >
            Admin Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
