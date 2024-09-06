// import { encodeURIComponent } from "querystring";x

import { redirect } from "next/navigation";

export async function GET(req, res) {
  // const redirectUri = process.env.FACEBOOK_REDIRECT_URI;
  const authUrl = `https://www.facebook.com/v10.0/dialog/oauth?client_id=${process.env.FACEBOOK_APP_ID}&redirect_uri=${process.env.FACEBOOK_REDIRECT_URI}&response_type=code&scope=email,public_profile`;

  redirect(authUrl);
  return new Response(authUrl, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
