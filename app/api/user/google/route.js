import { google } from "googleapis";

// Setup Google OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID, // Your Google OAuth client ID
  process.env.GOOGLE_CLIENT_SECRET, // Your Google OAuth client secret
  process.env.GOOGLE_REDIRECT_URL // Redirect URL, e.g., http://localhost:3000/api/user/google/callback
);

// Step 1: Redirect to Google's OAuth 2.0 server
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    // If there's no authorization code, redirect user to Google's OAuth consent screen
    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: ["profile", "email"],
    });

    return new Response(null, {
      status: 302,
      headers: {
        Location: url, // Redirect user to Google's consent screen
      },
    });
  }

  // Step 2: Exchange authorization code for access token
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Fetch user info from Google's API
    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: "v2",
    });

    const { data } = await oauth2.userinfo.get();

    // Return user data
    return new Response(JSON.stringify({ user: data }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // Handle errors (e.g., invalid authorization code, network issues)
    return new Response(
      JSON.stringify({
        error: "Authentication failed",
        details: error.message,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
