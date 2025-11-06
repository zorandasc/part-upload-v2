import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

//BECKEND RUTA ZA DOBAVLJANJE USERA IZ TOKENA. KO JE LOGOVAN
//KORISTI JE CONTEXT
export async function GET(req) {
  const token = req.cookies.get("token")?.value;

  if (!token) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    return NextResponse.json({ user: decoded }, { status: 200 });
  } catch (error) {
    // If token verification fails (e.g., expired, invalid signature)
    console.error("Token verification failed:", error.message);
    return NextResponse.json(
      { message: "Invalid or expired token" },
      { status: 401 }
    );
  }
}
