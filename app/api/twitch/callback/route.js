import axios from "axios";
import mongoose from "mongoose";
import UserInsights from "@/models/twitch";

export async function GET(req) {
  console.log(req.url);
  const { searchParams } = new URL(req.url);
  // const { code } = req.query;
  const code = searchParams.get("code");

  console.log(code);

  if (!code) {
    return new Response(JSON.stringify({ error: "Code is required" }), {
      status: 400,
    });
  }

  try {
    const response = await axios.post(
      `https://id.twitch.tv/oauth2/token`,
      null,
      {
        params: {
          client_id: process.env.TWITCH_CLIENT_ID,
          client_secret: process.env.TWITCH_CLIENT_SECRET,
          code,
          grant_type: "authorization_code",
          redirect_uri: process.env.TWITCH_REDIRECT_URI,
        },
      }
    );

    console.log(response.data);

    const { access_token } = response.data;

    const profileResponse = await axios.get(
      `https://api.twitch.tv/helix/users`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Client-ID": process.env.TWITCH_CLIENT_ID,
        },
      }
    );

    const { id, login: username } = profileResponse.data.data[0];

    await mongoose.connect(process.env.MONGODB_URI);

    let userInsights = await UserInsights.findOne({ username });

    if (!userInsights) {
      userInsights = new UserInsights({
        username,
        accessToken: access_token,
        followers: 0,
        following: 0,
        views: 0,
        clips: 0,
        hosts: 0,
        vods: 0,
        monthlyGrowth: [],
        yearlyGrowth: [],
        demographicInfo: {
          gender: "Not Provided",
          age_range: "Not Provided",
          country: "Not Provided",
        },
        historicalData: [],
      });
    } else {
      userInsights.accessToken = access_token;
    }

    const savedUser = await userInsights.save();

    return new Response(JSON.stringify({ access_token, username, savedUser }), {
      status: 200,
    });
  } catch (error) {
    console.error(error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
