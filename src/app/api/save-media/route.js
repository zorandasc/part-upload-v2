import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const data = await req.json();

    // Basic validation
    if (!data.mediaId || !data.contentType) {
      return NextResponse.json(
        { error: "mediaId and contentType are required" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("party");

    const mediaDoc = {
      mediaId: data.mediaId,
      name: data.name || null,
      mimeType: data.type || null,
      contentType: data.contentType, // "video" | "image"
      createdAt: new Date(),
      // Add user context if available (e.g. from session/JWT)
      userId: data.userId || null,
      metadata: data.metadata || {}
    };

    const result = await db.collection("media").insertOne(mediaDoc);

    return NextResponse.json({ success: true, id: result.insertedId });
  } catch (error) {
    console.error("❌ Error saving content:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
