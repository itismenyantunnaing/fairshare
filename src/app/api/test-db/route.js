import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const client = await clientPromise;
        const db = client.db("FairShare");

        // Verify connectivity by listing collections (no dependency on "users")
        const collections = await db.listCollections().toArray();
        const names = collections.map((c) => c.name);

        return NextResponse.json({
            status: "Connected!",
            database: "FairShare",
            collections: names,
        });
    } catch (e) {
        return NextResponse.json({ status: "Error", error: e.message }, { status: 500 });
    }
}