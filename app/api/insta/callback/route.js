import axios from "axios";
import mongoose from "mongoose";
import UserInsights from "@/models/insta";

export async function POST(req, res) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    return res.status(400).json({ error: "Code is required" });
  }

  try {
    // Getting access token from Instagram
    const response = await axios.post(
      `https://api.instagram.com/oauth/access_token`,
      null,
      {
        params: {
          client_id: process.env.INSTAGRAM_CLIENT_ID,
          client_secret: process.env.INSTAGRAM_CLIENT_SECRET,
          grant_type: "authorization_code",
          redirect_uri: process.env.INSTAGRAM_REDIRECT_URI,
          code,
        },
      }
    );

    const { access_token, user_id } = response.data;

    // Fetch Instagram user profile
    const profileResponse = await axios.get(
      `https://graph.instagram.com/${user_id}`,
      {
        params: {
          fields: "id,username",
          access_token,
        },
      }
    );

    const { id, username } = profileResponse.data;

    await mongoose.connect(process.env.MONGO_URI);

    let userInsights = await UserInsights.findOne({ username });

    // If user doesn't exist, create a new record
    if (!userInsights) {
      userInsights = new UserInsights({
        username,
        accessToken: access_token,
        followers: 0,
        views: 0,
        shares: 0,
        following: 0,
        recentPosts: [],
        monthlyGrowth: [],
        yearlyGrowth: [],
        demographicInfo: {
          gender: "Not Provided",
          age_range: "Not Provided",
        },
      });
    } else {
      userInsights.accessToken = access_token;
    }

    await userInsights.save();

    return res.status(200).json({ access_token, username });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "Failed to get access token or save user data" });
  }
}
