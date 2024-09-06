import axios from "axios";
import mongoose from "mongoose";
import Facebook from "@/models/fb"; // Adjust the path as needed

export async function GET(req, res) {
  const { code } = req.json();

  if (!code) {
    return res.status(400).json({ error: "Code is required" });
  }

  try {
    // Step 1: Get access token from Facebook
    const response = await axios.get(
      `https://graph.facebook.com/v10.0/oauth/access_token`,
      {
        params: {
          client_id: process.env.FACEBOOK_APP_ID,
          redirect_uri: process.env.FACEBOOK_REDIRECT_URI,
          client_secret: process.env.FACEBOOK_APP_SECRET,
          code,
        },
      }
    );

    const { access_token } = response.data;

    // Step 2: Get the user's profile information
    const profileResponse = await axios.get(`https://graph.facebook.com/me`, {
      params: { access_token, fields: "id,name" },
    });

    const { id, name } = profileResponse.data;

    await mongoose.connect(process.env.MONGO_URI);

    let userInsights = await Facebook.findOne({ username: id });

    if (!userInsights) {
      userInsights = new Facebook({
        username: id,
        accessToken: access_token,
        followers: 0,
        views: 0,
        shares: 0,
        following: 0,
        recentPosts: [],
        profileGrowth: [],
        demographicInfo: {
          gender: "Not Provided",
          age_range: "Not Provided",
        },
      });
    } else {
      userInsights.accessToken = access_token;
    }

    await userInsights.save();

    res.status(200).json({ access_token, username: id });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Failed to get access token or save user data" });
  }
}
