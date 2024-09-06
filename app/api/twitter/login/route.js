import { redirect } from "next/navigation";

export async function GET() {
  const authUrl = `https://twitter.com/i/oauth2/authorize?client_id=${process.env.TWITTER_CLIENT_ID}&redirect_uri=${process.env.TWITTER_REDIRECT_URI}&response_type=code&scope=tweet.read%20tweet.write&state=random_state&code_challenge=challenge&code_challenge_method=plain`;

  redirect(authUrl);
  return new Response(authUrl, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
