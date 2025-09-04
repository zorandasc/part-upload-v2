import { NextResponse } from "next/server";
//import { getAllImagesFromUploadThing } from "@/lib/images";
import clientPromise from "@/lib/mongodb";

//ROUTA ZA DOBAVLJANJE  SVIH SLIKA
//ROUTU POZIVA ImageGalery.jsx U HOME page

//ROUTA ZA DOBAVLJANJE  SVIH SLIKA
//ROUTU POZIVA ImageGalery.jsx U HOME page
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    //second parameter is optional (base of the number),
    const page = parseInt(searchParams.get("page") || 1, 10);
    const limit = parseInt(searchParams.get("limit") || 20, 10);
    const skip = (page - 1) * limit;

    const client = await clientPromise;
    const db = client.db("party");

    // Query images collection with pagination
    const files = await db
      .collection("images")
      .find({})
      .skip(skip)
      .limit(limit)
      .sort({ uploadedAt: -1 })
      .toArray();

    // Check if more images exist after this page
    const totalCount = await db.collection("images").countDocuments();

    return NextResponse.json(
      { files, totalCount, hasMore: page * limit < totalCount },
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch images" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
