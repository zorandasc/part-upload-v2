import { getCloudflareVideoStatus } from "@/lib/helper";
import clientPromise from "@/lib/mongodb";

//CALLED BY MEDIAMODAL, TO CHECK IF VIDEO IS READY TO STREAM
export async function GET(req, { params }) {
  try {
    const { id } = params; //mediaId
    const client = await clientPromise;

    const db = client.db("party");

    // Find media in DB
    const media = await db.collection("media").findOne({ mediaId: id });

    if (!media) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    // Only poll Cloudflare if not ready yet
    if (!media.readyToStream) {
      try {
        const cfStatus = await getCloudflareVideoStatus(id);

        if (cfStatus.readyToStream) {
          //if ready update db
          await db
            .collection("media")
            .updateOne({ _id: media._id }, { $set: { readyToStream: true } });

          media.readyToStream = true; // also update in the response
        }

        return NextResponse.json(media, {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      } catch (err) {
        console.error("CF status check failed:", err);
      }
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch media state" },
      { status: 500 }
    );
  }
}
