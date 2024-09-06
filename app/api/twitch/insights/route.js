import axios from "axios";
import mongoose from "mongoose";
import UserInsights from "@/models/twitch";
import { updateHistoricalData } from "@/utils/twitchHistoricalData";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username");

  if (!username) {
    return new Response(JSON.stringify({ error: "Username is required" }), {
      status: 400,
    });
  }

  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    const userInsights = await UserInsights.findOne({ username });

    if (!userInsights) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
      });
    }

    const { accessToken } = userInsights;

    // Fetch user insights from Twitch
    const profileResponse = await axios.get(
      `https://api.twitch.tv/helix/users`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Client-ID": process.env.TWITCH_CLIENT_ID,
        },
      }
    );

    const userProfile = profileResponse.data.data[0];

    const { id: userId, login } = userProfile;

    // Fetch additional data like followers, following, clips, hosts, etc.
    const followersResponse = await axios.get(
      `https://api.twitch.tv/helix/users/follows?to_id=${userId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Client-ID": process.env.TWITCH_CLIENT_ID,
        },
      }
    );

    const followers_count = followersResponse.data.total;

    const followingResponse = await axios.get(
      `https://api.twitch.tv/helix/users/follows?from_id=${userId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Client-ID": process.env.TWITCH_CLIENT_ID,
        },
      }
    );

    const following_count = followingResponse.data.total;

    const clipsResponse = await axios.get(
      `https://api.twitch.tv/helix/clips?broadcaster_id=${userId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Client-ID": process.env.TWITCH_CLIENT_ID,
        },
      }
    );

    const clips_count = clipsResponse.data.data.length;

    const hostsResponse = await axios.get(
      `https://api.twitch.tv/helix/streams?user_id=${userId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Client-ID": process.env.TWITCH_CLIENT_ID,
        },
      }
    );

    const hosts_count = hostsResponse.data.data.length;

    const vodsResponse = await axios.get(
      `https://api.twitch.tv/helix/videos?user_id=${userId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Client-ID": process.env.TWITCH_CLIENT_ID,
        },
      }
    );
    await updateHistoricalData(username, accessToken);

    const vods_count = vodsResponse.data.data.length;
    // Monthly and yearly growth calculation
    const now = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(now.getFullYear() - 1);

    const historicalData = await UserInsights.findOne({ username })
      .historicalData;

    for (let i = 0; i < 12; i++) {
      const start = new Date(oneYearAgo.getFullYear(), i, 1);
      const end = new Date(oneYearAgo.getFullYear(), i + 1, 0);

      const monthlyData = historicalData.filter(
        (data) => new Date(data.date) >= start && new Date(data.date) <= end
      );

      const startCount =
        monthlyData.length > 0 ? monthlyData[0].followersCount : 0;
      const endCount =
        monthlyData.length > 0
          ? monthlyData[monthlyData.length - 1].followersCount
          : 0;

      monthlyGrowth.push({
        month: start.toISOString().slice(0, 7),
        startFollowersCount: startCount,
        endFollowersCount: endCount,
        growth: endCount - startCount,
      });
    }

    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear(), 11, 31);

    const yearlyData = historicalData.filter(
      (data) =>
        new Date(data.date) >= startOfYear && new Date(data.date) <= endOfYear
    );

    const startYearCount =
      yearlyData.length > 0 ? yearlyData[0].followersCount : 0;
    const endYearCount =
      yearlyData.length > 0
        ? yearlyData[yearlyData.length - 1].followersCount
        : 0;

    yearlyGrowth.push({
      year: now.getFullYear(),
      startFollowersCount: startYearCount,
      endFollowersCount: endYearCount,
      growth: endYearCount - startYearCount,
    });

    // Twitch API does not provide demographic information So added a placeholder as Not Provided
    const demographicResponse = await axios.get(
      `https://api.twitch.tv/helix/users`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Client-ID": process.env.TWITCH_CLIENT_ID,
        },
      }
    );

    const demographicInfo = {
      gender: "Not Provided",
      age_range: "Not Provided",
      country: "Not Provided",
    };

    // Update the user insights in the database
    userInsights.followers = followers_count;
    userInsights.following = following_count;
    userInsights.clips = clips_count;
    userInsights.hosts = hosts_count;
    userInsights.vods = vods_count;

    userInsights.monthlyGrowth = monthlyGrowth;
    await userInsights.save();

    return new Response(JSON.stringify(usZLerInsights), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
