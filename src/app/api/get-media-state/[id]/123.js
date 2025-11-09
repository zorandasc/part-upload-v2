import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const CF_STREAM_TOKEN = process.env.CF_STREAM_TOKEN;

//TRY TO ENABLE VIDEO TO BE DOWNLOABLE AS .MP4
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

  const data = await res.json();
  if (!res.ok || !data.success)
    throw new Error(
      `Failed to enable download: ${JSON.stringify(data.errors)}`
    );

  return data.result;
};

//CALLED BY MEDIAMODAL, TO CHECK IF VIDEO IS READY TO STREAM
/**
 * Check if video is ready to stream — called from frontend polling.
 */
export async function GET(req, context) {
  try {
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch media state" },
      { status: 500 }
    );
  }
}
