// app/api/create-image-upload-url/route.js
import { NextResponse } from "next/server";

//1. Ask cloudflare for direct upload URL and send to frontend
export async function POST() {
  try {
    const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
    const CF_STREAM_TOKEN = process.env.CF_STREAM_TOKEN;

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/images/v2/direct_upload`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${CF_STREAM_TOKEN}`,
        },
      }
    );

    const data = await response.json();

    if (!data.success) {
      return NextResponse.json(
        { error: "Failed to get image upload URL", details: data },
        { status: 500 }
      );
    }

    const { id, uploadURL } = data.result;

    return NextResponse.json({ id, uploadURL });
  } catch (err) {
    console.error("Error creating image upload URL:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
