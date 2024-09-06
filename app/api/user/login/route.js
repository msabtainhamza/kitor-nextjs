import db from "@/db";
import { User } from "@/models/user";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(req) {
  db();

  const body = await req.json();
  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json(
      { message: "Please provide all the fields" },
      { status: 400 }
    );
  }

  const existingUser = await User.findOne({ email });

  if (!existingUser) {
    return NextResponse.json(
      { message: "User does not exist" },
      { status: 400 }
    );
  }

  const isPasswordCorrect = await bcrypt.compare(
    password,
    existingUser.password
  );

  if (!isPasswordCorrect) {
    return NextResponse.json(
      { message: "Invalid credentials" },
      { status: 400 }
    );
  }

  // Create JWT token
  const token = jwt.sign(
    { id: existingUser._id, email: existingUser.email },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  // Set the JWT token in a cookie
  const response = NextResponse.json(
    { message: "Login successful", token },
    { status: 200 }
  );

  response.cookies.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    maxAge: 3600, // 1 hour
    path: "/",
  });

  return response;
}
