"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminDonationsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin?tab=donations");
  }, [router]);
  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
      <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full" />
    </div>
  );
}
