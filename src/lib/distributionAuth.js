import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

/**
 * Check if the current session can manage distributions.
 * - super_admin: always true
 * - admin: true if admin doc has canManageDistribution === true
 * - otherwise: false
 */
export async function canManageDistribution(session) {
  if (!session) return false;
  if (session.role === "super_admin") return true;
  if (session.role !== "admin") return false;
  try {
    const client = await clientPromise;
    const db = client.db("FairShare");
    const admin = await db.collection("admins").findOne(
      { _id: new ObjectId(session.id) },
      { projection: { canManageDistribution: 1 } }
    );
    return admin?.canManageDistribution === true;
  } catch {
    return false;
  }
}
