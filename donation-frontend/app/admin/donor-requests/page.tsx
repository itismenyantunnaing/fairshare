/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Tab = "pending" | "approved" | "declined";

function safeArr(v: any): any[] {
  return Array.isArray(v) ? v : [];
}

function formatDate(v: any) {
  try {
    if (!v) return "";
    const d = typeof v === "string" || typeof v === "number" ? new Date(v) : new Date(String(v));
    if (Number.isNaN(d.getTime())) return String(v);
    return d.toLocaleString();
  } catch {
    return String(v ?? "");
  }
}

function TypeBadge({ type }: { type: string }) {
  const label =
    type === "foodsupport"
      ? "Food"
      : type === "medicalaid"
      ? "Medical"
      : type === "clothing"
      ? "Clothing"
      : "Donation";

  const bgClass =
    type === "foodsupport"
      ? "bg-amber-100 text-amber-800"
      : type === "medicalaid"
      ? "bg-rose-100 text-rose-800"
      : type === "clothing"
      ? "bg-indigo-100 text-indigo-800"
      : "bg-emerald-100 text-emerald-800";

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${bgClass}`}>
      {label}
    </span>
  );
}

// ---- normalize helpers ----

// Pending endpoint shape: { ok, data: { donation, foodsupport, medicalaid, clothing } }
// Approved endpoint shape: { ok, donations, foodsupport, medicalaid, clothing }
function normalizePendingPayload(pData: any) {
  // prefers nested .data if present
  const root = pData?.data && typeof pData.data === "object" ? pData.data : pData;

  return {
    donation: safeArr(root?.donation ?? root?.donations),
    foodsupport: safeArr(root?.foodsupport ?? root?.foodsupports),
    medicalaid: safeArr(root?.medicalaid ?? root?.medicalaids),
    clothing: safeArr(root?.clothing ?? root?.clothings),
  };
}

function normalizeApprovedPayload(aData: any) {
  // approved usually NOT nested, but we still support .data just in case
  const root = aData?.data && typeof aData.data === "object" ? aData.data : aData;

  return {
    donation: safeArr(root?.donation ?? root?.donations),
    foodsupport: safeArr(root?.foodsupport ?? root?.foodsupports),
    medicalaid: safeArr(root?.medicalaid ?? root?.medicalaids),
    clothing: safeArr(root?.clothing ?? root?.clothings),
  };
}

function normalizeDeclinedPayload(dData: any) {
  const root = dData?.data && typeof dData.data === "object" ? dData.data : dData;
  return {
    donation: safeArr(root?.donation ?? root?.donations),
    foodsupport: safeArr(root?.foodsupport ?? root?.foodsupports),
    medicalaid: safeArr(root?.medicalaid ?? root?.medicalaids),
    clothing: safeArr(root?.clothing ?? root?.clothings),
  };
}

function getUnitForType(type: string) {
  if (type === "foodsupport") return "QTY";
  if (type === "medicalaid") return "QTY";
  if (type === "clothing") return "PCS";
  return "mmk";
}

function calcItemsTotal(items: any[]): number | null {
  if (!Array.isArray(items) || items.length === 0) return null;
  const total = items.reduce((sum, it) => sum + (Number(it?.qty) || 0), 0);
  return total > 0 ? total : null;
}

function renderAmount(row: any) {
  if (row?.type === "donation") return row?.amount ?? "-";
  const total = calcItemsTotal(row?.items);
  return total ?? "-";
}

function renderCurrency(row: any) {
  if (row?.type === "donation") return row?.currency ?? "mmk";
  return getUnitForType(row?.type);
}

function renderPayment(row: any) {
  if (row?.type === "donation") return row?.paymentMethod ?? "-";
  return "-";
}

function renderEmail(row: any) {
  return row?.donor?.email ?? row?.email ?? "-";
}

function renderItemsCell(row: any) {
  if (row?.type === "donation") return <span>-</span>;

  if (!Array.isArray(row?.items) || row.items.length === 0) return <span>-</span>;

  return (
    <div className="space-y-1">
      {row.items.map((it: any, idx: number) => (
        <div key={idx} className="text-xs text-gray-700">
          • {String(it?.item ?? "-")} × {String(it?.qty ?? "-")}
          {it?.note ? <span className="text-gray-500"> ({String(it.note)})</span> : null}
        </div>
      ))}
    </div>
  );
}

function renderMessageCell(row: any) {
  return row?.message ? (
    <span className="block max-w-[260px] truncate">{row.message}</span>
  ) : (
    <span>-</span>
  );
}



export default function AdminDashboardPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("pending");

  const [checkingSession, setCheckingSession] = useState(true);

  const [pending, setPending] = useState<{ donation: any[]; foodsupport: any[]; medicalaid: any[]; clothing: any[] }>({
    donation: [],
    foodsupport: [],
    medicalaid: [],
    clothing: [],
  });

  const [approved, setApproved] = useState<{ donation: any[]; foodsupport: any[]; medicalaid: any[]; clothing: any[] }>({
    donation: [],
    foodsupport: [],
    medicalaid: [],
    clothing: [],
  });

  const [declined, setDeclined] = useState<{ donation: any[]; foodsupport: any[]; medicalaid: any[]; clothing: any[] }>({
  donation: [],
  foodsupport: [],
  medicalaid: [],
  clothing: [],
});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pendingRows = useMemo(() => {
    return [...pending.donation, ...pending.foodsupport, ...pending.medicalaid, ...pending.clothing];
  }, [pending]);

  const approvedRows = useMemo(() => {
    return [...approved.donation, ...approved.foodsupport, ...approved.medicalaid, ...approved.clothing];
  }, [approved]);

  const declinedRows = useMemo(() => {
  return [...declined.donation, ...declined.foodsupport, ...declined.medicalaid, ...declined.clothing];
}, [declined]);

  async function checkSession() {
    try {
      const res = await fetch("/api/auth/session", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!data?.ok) {
        router.replace("/admin/login");
        return false;
      }
      return true;
    } catch {
      router.replace("/admin/login");
      return false;
    } finally {
      setCheckingSession(false);
    }
  }

  async function loadAll() {
    setError(null);
    setLoading(true);
    try {
      const [pRes, aRes, dRes] = await Promise.all([
        fetch("/api/admin/pending", { cache: "no-store" }),
        fetch("/api/admin/approved", { cache: "no-store" }),
        fetch("/api/admin/declined", { cache: "no-store" }),
      ]);

      const pData = await pRes.json().catch(() => ({}));
      const aData = await aRes.json().catch(() => ({}));
      const dData = await dRes.json().catch(() => ({}));

      if (!pRes.ok || !pData?.ok) throw new Error(pData?.error || "Failed to load pending items");
      if (!aRes.ok || !aData?.ok) throw new Error(aData?.error || "Failed to load approved items");
      if (!dRes.ok || !dData?.ok) throw new Error(dData?.error || "Failed to load declined items");

      setPending(normalizePendingPayload(pData));
      setApproved(normalizeApprovedPayload(aData));
      setDeclined(normalizeDeclinedPayload(dData));
    } catch (e: any) {
      setError(e?.message || "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }

  async function approveItem(type: string, id: string) {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Approve failed");

      await loadAll();
    } catch (e: any) {
      setError(e?.message || "Approve failed");
    } finally {
      setLoading(false);
    }
  }

  async function declineItem(type: string, id: string) {
  setError(null);
  setLoading(true);
  try {
    const res = await fetch("/api/admin/decline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, id }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.ok) throw new Error(data?.error || "Decline failed");

    await loadAll();
  } catch (e: any) {
    setError(e?.message || "Decline failed");
  } finally {
    setLoading(false);
  }
}

  async function logout() {
    setError(null);
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setLoading(false);
      router.replace("/admin/login");
    }
  }

  useEffect(() => {
    (async () => {
      const ok = await checkSession();
      if (ok) await loadAll();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="rounded-2xl border bg-white px-6 py-4 text-sm text-gray-600 shadow-sm">Checking admin session...</div>
      </main>
    );
  }

  const rows = tab === "pending" ? pendingRows : tab === "approved" ? approvedRows : declinedRows;


  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-500">Fair Sharing</p>
            <h1 className="text-2xl font-semibold text-gray-900">Admin Dashboard</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => loadAll()}
              disabled={loading}
              className="rounded-xl border bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100 disabled:opacity-60"
            >
              Refresh
            </button>
            <button
              onClick={logout}
              disabled={loading}
              className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setTab("pending")}
            className={`rounded-xl px-4 py-2 text-sm font-medium ${
              tab === "pending" ? "bg-black text-white" : "border bg-white text-gray-800 hover:bg-gray-100"
            }`}
          >
            Pending ({pendingRows.length})
          </button>
          <button
            onClick={() => setTab("approved")}
            className={`rounded-xl px-4 py-2 text-sm font-medium ${
              tab === "approved" ? "bg-black text-white" : "border bg-white text-gray-800 hover:bg-gray-100"
            }`}
          >
            Approved ({approvedRows.length})
          </button>
          <button
  onClick={() => setTab("declined")}
  className={`rounded-xl px-4 py-2 text-sm font-medium ${
    tab === "declined" ? "bg-black text-white" : "border bg-white text-gray-800 hover:bg-gray-100"
  }`}
>
  Declined ({declinedRows.length})
</button>

        </div>

        {error ? (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : null}

        <div className="rounded-3xl border bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b text-xs uppercase tracking-wide text-gray-500">
  <tr className="bg-gray-50 sticky top-0">
    <th className="px-4 py-3">Email</th>
    <th className="px-4 py-3">Type</th>
    <th className="px-4 py-3">Amount</th>
    <th className="px-4 py-3">Unit</th>
    <th className="px-4 py-3">Payment</th>
    <th className="px-4 py-3">Region</th>
    <th className="px-4 py-3">Items</th>
    <th className="px-4 py-3">Message</th>
    <th className="px-4 py-3">Created</th>
    {tab === "pending" ? <th className="px-4 py-3">Action</th> : null}
  </tr>
</thead>


              <tbody className="divide-y">
                {rows.map((row: any) => (
                  <tr key={row.id || row._id} className="hover:bg-gray-50">
  <td className="px-4 py-2">{renderEmail(row)}</td>

  <td className="px-4 py-2">
    <TypeBadge type={row.type} />
  </td>

  <td className="px-4 py-2">{renderAmount(row)}</td>
  <td className="px-4 py-2">{renderCurrency(row)}</td>
  <td className="px-4 py-2">{renderPayment(row)}</td>
  <td className="px-4 py-2">{row.region ?? "-"}</td>

  <td className="px-4 py-2">{renderItemsCell(row)}</td>
  <td className="px-4 py-2">{renderMessageCell(row)}</td>

  <td className="px-4 py-2">{formatDate(row.createdAt || row.timestamp)}</td>

  {tab === "pending" ? (
  <td className="px-4 py-2">
    <div className="flex gap-2">
      <button
        onClick={() => approveItem(row.type, row.id)}
        disabled={loading}
        className="rounded-xl bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        Approve
      </button>

      <button
        onClick={() => declineItem(row.type, row.id)}
        disabled={loading}
        className="rounded-xl bg-rose-600 px-3 py-1 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
      >
        Decline
      </button>
    </div>
  </td>
) : null}

</tr>

                ))}

                {rows.length === 0 ? (
                  <tr>
                    <td className="px-4 py-10 text-center text-gray-500" colSpan={tab === "pending" ? 9 : 8}>
                      {loading ? "Loading..." : tab === "pending" ? "No pending requests." : "No approved items yet."}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <p className="mt-4 text-xs text-gray-500">
          Approve moves records from <code>pending_*</code> collections into approved collections and removes them from pending.
        </p>
      </div>
    </main>
  );
}
