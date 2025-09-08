import { getCloudflareVideoStatus } from "@/lib/helper";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

//CALLED BY MEDIAMODAL, TO CHECK IF VIDEO IS READY TO STREAM
export async function GET(req, context) {
  try {
    const { id } = await context.params;

    const client = await clientPromise;

    const db = client.db("party");

    // Find media in DB

    const media = await db
      .collection("media")
      .findOne({ _id: ObjectId.createFromHexString(id) });

    if (!media) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    // Only poll Cloudflare if not ready yet , FALSE
    if (!media.readyToStream) {
      const cfStatus = await getCloudflareVideoStatus(media.mediaId);

      //UPDTE DB AND RESPONSE IF READY, TRUE
      if (cfStatus.readyToStream) {
        //if ready update db
        await db
          .collection("media")
          .updateOne({ _id: media._id }, { $set: { readyToStream: true } });

        media.readyToStream = true; // also update in the response
      }
    }
    return NextResponse.json(media, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch media state" },
      { status: 500 }
    );
  }
}
