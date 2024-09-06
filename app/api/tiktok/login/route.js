// import { NextResponse } from "next/server";

export async function GET() {
  try {
    const redirectURI = encodeURIComponent(process.env.TIKTOK_REDIRECT_URI);
    const authUrl = `https://www.tiktok.com/auth/authorize?client_key=${process.env.TIKTOK_CLIENT_KEY}&redirect_uri=${redirectURI}&response_type=code&scope=user.info.basic`;

    return new Response(authUrl, {
      status: 302,
      headers: {
        Location: authUrl,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error during login:", error);
    return new Response(JSON.stringify({ message: "Error during login" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}
