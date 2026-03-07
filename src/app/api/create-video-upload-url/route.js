import { NextResponse } from "next/server";

const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const CF_STREAM_TOKEN = process.env.CF_STREAM_TOKEN;

//helper: base64 encode
function b64(str) {
  return Buffer.from(str).toString("base64");
}

//1. Ask cloudflare for direct upload URL and send to frontend
///stream?direct_user=true
export async function POST(req) {
  const { fileSize, fileName, fileType } = await req.json();

  if (!fileSize || typeof fileSize !== "number" || fileSize <= 0) {
    return NextResponse.json({ error: "Invalid fileSize" }, { status: 400 });
  }
  try {
    //1. DEFINE CONSTRAINTS
    const maxDurationSeconds = "600"; //maxx allowed duration of video is 10 min
    const expiryDate = new Date(Date.now() + 60 * 60 * 1000); //1 hour
    const expiryISO = expiryDate.toISOString(); // RFC3339

    //2.BUILD UPLOAD-METADATA HEADER VALUE
    //The Upload-Metadata header should contain key-value pairs.
    //The keys are text and the values should be encoded in base64.
    // Separate the key and values by a space, not an equal sign.
    //To join multiple key-value pairs, include a comma with no additional spaces.
    //Object.entries Returns an array of key/values
    //https://developers.cloudflare.com/stream/uploading-videos/direct-creator-uploads/
    const metadataParts = [
      `maxDurationSeconds ${b64(maxDurationSeconds)}`,
      `expiry ${b64(expiryISO)}`,
      // Optional: add requiresignedurls if you want private playback
      // `requiresignedurls`,
      // Optional: filename & filetype for nicer dashboard view
      fileName ? `filename ${b64(fileName)}` : null,
      fileType ? `filetype ${b64(fileType)}` : null,
    ].filter(Boolean); // remove nulls

    const uploadMetadata = metadataParts.join(",");

    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/stream?direct_user=true`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${CF_STREAM_TOKEN}`,
          "Tus-Resumable": "1.0.0",
          "Upload-Length": fileSize.toString(),
          "Upload-Metadata": uploadMetadata,
        },
      },
    );

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error("Cloudflare error:", errorData);
      return NextResponse.json(
        { error: errorData.errors?.[0]?.message || "Cloudflare API failed" },
        { status: res.status },
      );
    }

    //extracting Location (uploadURL) + stream-media-id (uid).
    const uploadURL = res.headers.get("Location");
    const uid = res.headers.get("stream-media-id");

    if (!uid || !uploadURL) {
      return NextResponse.json(
        { error: "Missing uploadURL or uid" },
        { status: 500 },
      );
    }

    console.log(`Created upload: ${uid} | expires: ${expiryISO}`);

    return NextResponse.json({ uploadURL, uid });
  } catch (err) {
    console.error("Cloudflare API error:", err);
    return NextResponse.json(
      { error: "Failed to create upload URL" },
      { status: 500 },
    );
  }
}
