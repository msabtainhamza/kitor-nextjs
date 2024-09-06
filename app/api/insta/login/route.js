import { redirect } from "next/navigation";

export async function GET(req, res) {
  const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${process.env.INSTAGRAM_CLIENT_ID}&redirect_uri=${process.env.INSTAGRAM_REDIRECT_URI}&response_type=code&scope=user_profile,user_media`;

  redirect(authUrl);
  return new Response(authUrl, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
