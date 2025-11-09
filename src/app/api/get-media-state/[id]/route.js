import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const CF_STREAM_TOKEN = process.env.CF_STREAM_TOKEN;

/*CLOUDFLAR Stream must download and encode the video, 
which can take a few seconds to a few minutes depending on the length of your video.
When the readyToStream value returns true, your video is ready for streaming. 
https://developers.cloudflare.com/stream/uploading-videos/upload-via-link/*/
//POLL CF TO SEE IS VIDEO READY TO STREAM
export const getCloudflareVideoStatus = async (mediaId) => {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/stream/${mediaId}`,
    {
      headers: {
        Authorization: `Bearer ${CF_STREAM_TOKEN}`,
      },
    }
  );

  if (!res.ok) throw new Error(`Cloudflare API error: ${res.status}`);
  const data = await res.json();

  if (!data.success)
    throw new Error(
      `Cloudflare API returned error: ${JSON.stringify(data.errors)}`
    );

  // Cloudflare wraps everything in data.result
  return {
    readyToStream: data.result.readyToStream,
    status: data.result.status.state, // "inprogress", "ready", "error"
    duration: data.result.duration,
    size: data.result.size,
  };
};

//CALLED BY MEDIAMODAL, TO CHECK IF VIDEO IS READY TO STREAM
/**
 * Check if video is ready to stream — called from frontend polling.
 */
export async function GET(req, context) {
  try {
    const { id } = await context.params;

    const client = await clientPromise;

    const db = client.db("party");

    // Find media in DB
    const mediaInDb = await db
      .collection("media")
      .findOne({ _id: ObjectId.createFromHexString(id) });

    if (!mediaInDb) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    // Only poll Cloudflare if  FALSE in DB,not ready yet,
    if (!mediaInDb.readyToStream) {
      const cfStatus = await getCloudflareVideoStatus(mediaInDb.mediaId);

      if (cfStatus.readyToStream && cfStatus.status === "ready") {
        //if true UPDTE DB AND RESPONSE
        await db
          .collection("media")
          .updateOne(
            { _id: mediaInDb._id },
            { $set: { readyToStream: true, status: cfStatus.status } }
          );

        // also update in the response
        mediaInDb.readyToStream = true;
        mediaInDb.status = cfStatus.status;
      }
    }
    return NextResponse.json(mediaInDb, {
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
