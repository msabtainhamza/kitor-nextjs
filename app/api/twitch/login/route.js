import { redirect } from "next/navigation";

export async function GET() {
  const authUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${process.env.TWITCH_CLIENT_ID}&redirect_uri=${process.env.TWITCH_REDIRECT_URI}&response_type=code&scope=user:read:follows%20user_read%20user:read:email%20channel:read:stream_key`;

  return redirect(authUrl);
}
