import { NextResponse } from "next/server";
//import { getAllImagesFromUploadThing } from "@/lib/images";
import clientPromise from "@/lib/mongodb";

//ROUTA ZA DOBAVLJANJE  SVIH SLIKA
//ROUTU POZIVA ImageGalery.jsx U HOME page
export async function GET(req) {
  try {
    const client = await clientPromise;
    const db = client.db("party");

    // Query images collection with pagination
    const files = await db
      .collection("images")
      .find({})
      .sort({ uploadedAt: -1 })
      .toArray();

    // Check if more images exist after this page
    const totalCount = await db.collection("images").countDocuments();

    return NextResponse.json(
      { files, totalCount },
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch images" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
  /*
  const { files, hasMore } = await getAllImagesFromUploadThing({
    limit,
    offset,
  });
*/
  //return NextResponse.json({ files, hasMore });
}
