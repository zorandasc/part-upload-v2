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
  const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
  const CF_STREAM_TOKEN = process.env.CF_STREAM_TOKEN;

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/stream/${mediaId}`,
    {
      headers: {
        Authorization: `Bearer ${CF_STREAM_TOKEN}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error(`Cloudflare API error: ${res.status}`);
  }

  const data = await res.json();

  // Cloudflare wraps everything in data.result
  return {
    readyToStream: data.result.readyToStream,
    status: data.result.status.state,
    duration: data.result.duration,
    size: data.result.size,
  };
};

//CALLED BY MEDIAMODAL, TO CHECK IF VIDEO IS READY TO STREAM
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
      const cfStatus = await getCloudflareVideoStatus(media.mediaId);

      //if ready ENABLE FOR VIDEO TO BE DOWNLOADABLE
      if (cfStatus.readyToStream && !cfStatus.downloadEnabled) {
        // Enable downloads via Cloudflare API
        // This enable upload video for future evenetualy mp4 download
        const cfResponse = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/stream/${media.mediaId}/downloads`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${CF_STREAM_TOKEN}`,
              "Content-Type": "application/json",
            },
          }
        );

        const cfResult = await cfResponse.json();

        if (!cfResult.success) {
          console.error("❌ Failed to enable download:", cfResult.errors);
        } else {
          console.log(`✅ Downloads enabled for video ${media.mediaId}`);
        }

        //if ready UPDTE DB AND RESPONSE IF READY, TRUE
        await db
          .collection("media")
          .updateOne(
            { _id: media._id },
            { $set: { readyToStream: true, downloadEnabled: true } }
          );

        // also update in the response
        media.readyToStream = true;
        media.downloadEnabled = true;
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
