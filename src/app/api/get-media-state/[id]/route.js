import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const CF_STREAM_TOKEN = process.env.CF_STREAM_TOKEN;

//HELPER FUCNTION
/*CLOUDFLAR Stream must upload and encode the video, 
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

//HELPER FUCNTION
//TRY TO ENABLE VIDEO TO BE DOWNLOABLE AS .MP4
//this is done only once per video
export const enableCloudflareVideoDownload = async (mediaId) => {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/stream/${mediaId}/downloads`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CF_STREAM_TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  );
  /*
  const data = await res.json();
  if (!res.ok || !data.success)
    throw new Error(
      `Failed to enable download: ${JSON.stringify(data.errors)}`
    );

  return data.result;
  */
};

//API POINT CALLED BY MEDIAMODAL, TO CHECK IF VIDEO IS READY TO STREAM
/**
 * Check if video is ready to stream — called from frontend polling.
 * THE VIDEO IS READY TO STREM IF:
 * 1. CLOUDFLARE SET FLAG readyToStream TO TRUE
 * 2. CDN NETWORK HAS PROPAGATED CONTENT
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
      //1. Get readyToStream FROM CLOUDFLARE
      const cfStatus = await getCloudflareVideoStatus(mediaInDb.mediaId);

      console.log("cfStatus.readyToStrea", cfStatus.readyToStream);

      if (cfStatus.readyToStream && cfStatus.status === "ready") {
        //2. Before marking ready, probe CDN availability
        // CHANGED: Probe the HLS manifest, not the iframe HTML
        // The manifest is the source of truth for playback
        const manifestUrl = `https://videodelivery.net/${mediaInDb.mediaId}/manifest/video.m3u8`;

        try {
          // 2. Probe
          const probe = await fetch(manifestUrl, { method: "HEAD" });

          if (probe.ok) {
            console.log("✅ CDN fully propagated (Video + Thumb)");
            //if BOTH CLOUDFLARE AND CDN NETWORK true
            //THEN UPDTE IN DB AND RESPONSe

            //TRY TO ENABLE VIDOE TO BE DOWLOADABLE
            await enableCloudflareVideoDownload(mediaInDb.mediaId);

            //UPDATE MONGO DB
            await db.collection("media").updateOne(
              { _id: mediaInDb._id },
              {
                $set: {
                  readyToStream: true,
                  status: cfStatus.status,
                  allowDownload: true,
                },
              }
            );

            // also update in the response
            mediaInDb.readyToStream = true;
            mediaInDb.status = cfStatus.status;
            mediaInDb.allowDownload = true;
          } else {
            console.log("CDN not ready yet, will retry later...");
          }
        } catch (error) {
          console.log("CDN still propagating, skipping update this round");
        }
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
