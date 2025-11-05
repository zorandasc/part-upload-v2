import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import clientPromise from "@/lib/mongodb";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

//LOGIN ONLY TO HAVE ABILITY TO DELETE MEDIA
export async function POST(req) {
  const { username, password } = await req.json();

  const client = await clientPromise;
  const db = client.db("party");

  const user = await db.collection("users").findOne({ username });

  if (!user) {
    return NextResponse.json(
      { error: "Nevalidni kredencijali" },
      { status: 401 }
    );
  }

  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = jwt.sign({ username: user.username }, JWT_SECRET, {
    expiresIn: "1h",
  });

  const response = NextResponse.json({
    message: "Login successful",
    user: user.username,
  });
  response.cookies.set("token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
  });
  return response;
}
