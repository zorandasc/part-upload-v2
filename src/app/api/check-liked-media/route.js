import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";

//Routa koja provjerava dali u Atlas mongo db bazi
//postoje id-ijevi koji su LikedPage ako ne prune
//localstrage automatically
//Ovu rutu poziva LikedPage samo jednom
export async function POST(req) {
  try {
    const { ids } = await req.json();

    if (!Array.isArray(ids)) {
      return NextResponse.json(
        { error: "ids must be an array" },
        { status: 400 },
      );
    }

    const validIds = ids.filter(
      (id) => typeof id === "string" && ObjectId.isValid(id),
    );

    if (validIds.length === 0) {
      return NextResponse.json({ existingIds: [] });
    }

    const objectIds = validIds.map((id) => new ObjectId(id));

    const client = await clientPromise;
    const db = client.db("party");

    //.project({ _id: 1 }) tells MongoDB to return only the _id field
    const existing = await db
      .collection("media")
      .find({ _id: { $in: objectIds } })
      .project({ _id: 1 })
      .toArray();

    return NextResponse.json({
      existingIds: existing.map((item) => item._id.toString()),
    });
  } catch (error) {
    console.error("Failed to check liked media:", error);
    return NextResponse.json(
      { error: "Failed to check liked media" },
      { status: 500 },
    );
  }
}
