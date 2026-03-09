//ROUTE FOR DELETING CLOUDFLARE (NO MONGO) PENDINGUPLOAD VIDEOS
//WHICH ARE FOrMED AFTER USER CANCEL OF VIDEO UPLOAD
export async function POST(req) {
  try {
    //1. get uid form cancelUpload in Uploadcontext
    const { uid } = await req.json();

    if (!uid) {
      return Response.json({ error: "UID required" }, { status: 400 });
    }

    const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
    const CF_STREAM_TOKEN = process.env.CF_STREAM_TOKEN;

    //2. Get video info first to get the status of video
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/stream/${uid}`,
      {
        headers: {
          Authorization: `Bearer ${CF_STREAM_TOKEN}`,
        },
      },
    );

    const data = await res.json();
    const video = data.result;

    if (!video) {
      return Response.json({ success: true });
    }

    //3. check video status of unfinished uploads
    if (video.status?.state !== "pendingupload") {
      return Response.json(
        { error: "Cannot delete completed video" },
        { status: 403 },
      );
    }

    //4. Only delete video with unfinished uploads
    await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/stream/${uid}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${CF_STREAM_TOKEN}`,
        },
      },
    );

    return Response.json({ success: true });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
