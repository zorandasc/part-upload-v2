import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    //second parameter is optional (base of the number),
    const page = parseInt(searchParams.get("page") || 1, 10);
    //Prevent someone from asking limit=999999 and crashing the DB:
    const limit = Math.min(parseInt(searchParams.get("limit") || 20, 10));
    const skip = (page - 1) * limit;

    const client = await clientPromise;
    const db = client.db("party");

    // Query media collection with pagination
    const files = await db
      .collection("media")
      .find({})
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .toArray();

    // Check if more item exist after this page
    const totalCount = await db.collection("media").countDocuments();

    return NextResponse.json(
      { files, totalCount, hasMore: page * limit < totalCount },
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch media" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
