import clientPromise from "@/lib/mongodb";
import { getSession } from "@/lib/auth";

/**
 * GET /api/admin/counts
 * Returns counts for admin dashboard: hostels (pending, approved) and donations (pending, approved).
 * Admin/super_admin only.
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "super_admin")) {
      return Response.json({ success: false, error: "ဝင်ရောက်ခွင့် မရှိပါ။" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("FairShare");

    const donationFilter = { $or: [{ distributionId: { $exists: false } }, { distributionId: null }] };

    const [hostelsPending, hostelsApproved, hostelsAutoRejected, donationsPending, donationsApproved] = await Promise.all([
      db.collection("hostels").countDocuments({ "verification.status": "pending" }),
      db.collection("hostels").countDocuments({ "verification.status": "approved" }),
      db.collection("hostels").countDocuments({ "verification.status": "auto_rejected" }),
      db.collection("donations").countDocuments({ ...donationFilter, status: "pending" }),
      db.collection("donations").countDocuments({ ...donationFilter, status: "approved" }),
    ]);

    return Response.json({
      success: true,
      hostelsPending,
      hostelsApproved,
      hostelsAutoRejected,
      donationsPending,
      donationsApproved,
    });
  } catch (e) {
    console.error("Admin counts GET error:", e);
    return Response.json({ success: false, error: e.message }, { status: 500 });
  }
}
