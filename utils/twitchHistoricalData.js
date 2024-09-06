import axios from "axios";
import UserInsights from "@/models/twitch";

export async function updateHistoricalData(username, accessToken) {
  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    const userInsights = await UserInsights.findOne({ username });

    if (!userInsights) {
      throw new Error("User not found");
    }

    // Fetch current data
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
    const { id: userId } = userProfile;

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

    const vods_count = vodsResponse.data.data.length;

    // Prepare historical data entry
    const today = new Date();
    const historicalEntry = {
      date: today,
      followersCount: followers_count,
      viewsCount: userInsights.views,
      clipsCount: clips_count,
      hostsCount: hosts_count,
      vodsCount: vods_count,
    };

    // Update the userInsights document with historical data
    userInsights.historicalData.push(historicalEntry);
    await userInsights.save();
  } catch (error) {
    console.error("Failed to update historical data:", error);
  }
}
