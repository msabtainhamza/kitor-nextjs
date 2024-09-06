import axios from "axios";
import mongoose from "mongoose";
import UserInsights from "@/models/tiktok";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  // const { code } = req.query;
  const code = searchParams.get("code");

  // if (!code) {
  //   return res.status(400).json({ error: "Code is required" });
  // }

  // return new Response(JSON.stringify({ code }), {
  //   status: 200,
  //   headers: {
  //     "Content-Type": "application/json",
  //   },
  // });

  try {
    // Exchange code for access token
    const tokenResponse = await axios.post(
      "https://open-api.tiktok.com/oauth/access_token/",
      null,
      {
        params: {
          client_key: process.env.TIKTOK_CLIENT_KEY,
          client_secret: process.env.TIKTOK_CLIENT_SECRET,
          code,
          grant_type: "authorization_code",
          redirect_uri: process.env.TIKTOK_REDIRECT_URI,
        },
      }
    );

    const { access_token } = tokenResponse.data;

    // Get user profile info
    const profileResponse = await axios.get(
      "https://open-api.tiktok.com/user/info/",
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    const { user_id, nickname } = profileResponse.data;

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);

    // Check if user already exists
    let userInsights = await UserInsights.findOne({ username: user_id });

    if (!userInsights) {
      userInsights = new UserInsights({
        username: user_id,
        accessToken: access_token,
        followers: 0,
        following: 0,
        views: 0,
        likes: 0,
        shares: 0,
        demographicInfo: {
          gender: "Not Provided",
          age_range: "Not Provided",
          country: "Not Provided",
        },
        monthlyGrowth: [],
        yearlyGrowth: [],
      });
    } else {
      userInsights.accessToken = access_token;
    }

    await userInsights.save();

    res.status(200).json({ access_token, username: user_id });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Failed to get access token or save user data" });
  }
}
