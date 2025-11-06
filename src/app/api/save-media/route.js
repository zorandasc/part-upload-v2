import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";

//CREATE AND SAVE NEW JSON OBJECT WITH GENERATED URL FROM CLODFLAER
//THE IMAGE OR VIDEO HAVE DIRECT UPLOAD FROM FRONTEND
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

    /*CF Stream must download and encode the video, 
    which can take a few seconds to a few minutes depending on the length of your video.
    When the readyToStream value returns true, your video is ready for streaming. 
    https://developers.cloudflare.com/stream/uploading-videos/upload-via-link/
    */
    const mediaDoc = {
      mediaId: data.mediaId,
      name: data.name || null,
      mimeType: data.type || null,
      contentType: data.contentType, // "video" | "image"
      createdAt: new Date(),
      userId: data.userId || null, // Add user context if available
      metadata: data.metadata || {},
      readyToStream: data.contentType === "video" ? false : true, // images are always "ready"
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
