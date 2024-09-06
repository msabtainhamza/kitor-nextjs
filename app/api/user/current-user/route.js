import db from "@/db";
import { User } from "@/models/user";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function GET(req) {
  db();

  // Get the token from cookies
  const token = req.cookies.get("token").value;
  console.log("Token:", token);
  console.log("Type of token:", typeof token);

  if (!token || typeof token !== "string") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Debugging statement to check decoded token
    console.log("Decoded token:", decoded);

    // Fetch user based on the decoded token information
    const user = await User.findById(decoded.id);

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Return the current user's information
    return NextResponse.json({ user }, { status: 200 });
  } catch (err) {
    console.error("Token verification failed:", err);
    return NextResponse.json({ message: "Invalid token" }, { status: 401 });
  }
}
