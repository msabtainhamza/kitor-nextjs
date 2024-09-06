import axios from "axios";
import mongoose from "mongoose";
import UserInsights from "@/models/twitter";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    return new Response(JSON.stringify({ error: "Code is required" }), {
      status: 400,
    });
  }

  try {
    const response = await axios.post(
      `https://api.twitter.com/oauth2/token`,
      null,
      {
        params: {
          client_id: process.env.TWITTER_CLIENT_ID,
          client_secret: process.env.TWITTER_CLIENT_SECRET,
          code,
          grant_type: "authorization_code",
          redirect_uri: process.env.TWITTER_REDIRECT_URI,
        },
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    console.log("Twitter Response Data:", response.data);

    const { access_token } = response.data;

    const profileResponse = await axios.get(
      `https://api.twitter.com/2/users/me`,
      {
        headers: { Authorization: `Bearer ${access_token}` },
      }
    );

    const { username } = profileResponse.data;

    await mongoose.connect(process.env.MONGO_URI);

    let userInsights = await UserInsights.findOne({ username });

    if (!userInsights) {
      userInsights = new UserInsights({
        username,
        accessToken: access_token,
        followers: 0,
        following: 0,
        likes: 0,
        retweets: 0,
        tweets: 0,
        monthlyGrowth: [],
        yearlyGrowth: [],
        demographicInfo: {
          gender: "Not Provided",
          age_range: "Not Provided",
          country: "Not Provided",
        },
      });
    } else {
      userInsights.accessToken = access_token;
    }

    await userInsights.save();

    return new Response(JSON.stringify({ access_token, username }), {
      status: 200,
    });
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: "Failed to get access token or save user data" }),
      { status: 500 }
    );
  }
}
