import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

export async function POST(req) {
  try {
    const data = await req.json();
    const { _id } = data;

    // Basic validation
    if (!_id) {
      return NextResponse.json({ error: "Id required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("party");

    // 🔹 Find the document first so we can access mediaId and contentType
    const existing = await db
      .collection("media")
      .findOne({ _id: ObjectId.createFromHexString(_id) });

    if (!existing) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    //TRY TO DELETE OBJECT IN MONGODB by _id
    const deleteResult = await db
      .collection("media")
      .deleteOne({ _id: existing._id });

    //TRY TO DELETE MEDIA IN CLOUDFLARE by mediaId
    const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
    const CF_STREAM_TOKEN = process.env.CF_STREAM_TOKEN;

    let cfUrl = "";

    if (existing.contentType === "video") {
      // Cloudflare Stream
      cfUrl = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/stream/${existing.mediaId}`;
    } else if (existing.contentType === "image") {
      // Cloudflare Images
      cfUrl = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/images/v1/${existing.mediaId}`;
    }

    if (cfUrl) {
      const res = await fetch(cfUrl, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${CF_STREAM_TOKEN}` },
      });

      if (!res.ok) {
        //IF FAILURE REVERT DELETED MONGODB OBJECT, RETURN FAILURE TO FRONTEND
        await db.collection("media").insertOne(existing);

        return NextResponse.json(
          { error: "Cloudflare deletion failed, reverted MongoDB" },
          { status: 500 }
        );
      }
    }
    return NextResponse.json({ success: true });
    //IF SUCESS, RETURN SUCCESS TO FRONTEND
  } catch (error) {
    console.error("❌ Error deleting media:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
