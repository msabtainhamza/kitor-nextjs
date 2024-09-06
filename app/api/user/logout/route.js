import { NextResponse } from "next/server";

export async function POST(req) {
  // Clear the token cookie
  const response = NextResponse.json(
    { message: "Logged out successfully" },
    { status: 200 }
  );

  // Set the token cookie to expire in the past to effectively clear it
  response.cookies.set("token", "", {
    maxAge: -1, // Expire immediately
    path: "/", // Ensure it applies to the whole domain
  });

  return response;
}
