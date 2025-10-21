import { NextResponse } from "next/server";

const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const CF_STREAM_TOKEN = process.env.CF_STREAM_TOKEN;

//1. Ask cloudflare for direct upload URL and send to frontend
export async function POST(req) {
  const { fileSize, metadata } = await req.json(); // include metadata in request

  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/stream?direct_user=true`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${CF_STREAM_TOKEN}`,
          "Tus-Resumable": "1.0.0",
          "Upload-Length": fileSize.toString(),
          "Upload-Metadata": metadata,
        },
      }
    );

    const uploadURL = res.headers.get("Location");
    const uid = res.headers.get("stream-media-id");

    if (!res.ok || !uploadURL) {
      const data = await res.json();
      return NextResponse.json({ error: data.errors }, { status: 500 });
    }

    return NextResponse.json({ uploadURL, uid });
  } catch (err) {
    console.error("Cloudflare API error:", err);
    return NextResponse.json(
      { error: "Failed to create upload URL" },
      { status: 500 }
    );
  }
}
