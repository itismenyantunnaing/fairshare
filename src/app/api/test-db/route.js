import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const client = await clientPromise;
        const db = client.db("FairShare");

        // Try to fetch the users you imported earlier
        const users = await db.collection("users").find({}).toArray();

        return NextResponse.json({
            status: "Connected!",
            database: "FairShare",
            userCount: users.length
        });
    } catch (e) {
        return NextResponse.json({ status: "Error", error: e.message }, { status: 500 });
    }
}