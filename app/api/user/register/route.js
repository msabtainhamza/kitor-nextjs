import db from "@/db";
import { User } from "@/models/user";
import { NextResponse } from "next/server";

export async function POST(req) {
  db();

  const body = await req.json();
  const { fullName, email, password } = body;

  if (!fullName || !email || !password) {
    return NextResponse.json(
      { message: "Please provide all the fields" },
      { status: 400 }
    );
  }

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    return NextResponse.json(
      { message: "User already exists" },
      { status: 400 }
    );
  }

  try {
    const user = await User.create(body);
    return NextResponse.json(
      { message: "User created successfully", User },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export function GET() {
  return NextResponse.json({ message: "Method not allowed" }, { status: 405 });
}
