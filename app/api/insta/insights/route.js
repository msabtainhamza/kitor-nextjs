import axios from "axios";
import mongoose from "mongoose";
import UserInsights from "@/models/insta";
import { fetchHistoricalData } from "@/utils/instaHistoricalData";

export async function POST(req, res) {
  const { username } = await req.json();

  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  try {
    // MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGO_URI);
    }

    const userInsights = await UserInsights.findOne({ username });

    if (!userInsights) {
      return res.status(404).json({ error: "User not found" });
    }

    const { accessToken } = userInsights;

    // Fetch Instagram profile data
    const profileResponse = await axios.get(`https://graph.instagram.com/me`, {
      params: {
        fields:
          "id,username,account_type,media_count,followers_count,follows_count",
        access_token: accessToken,
      },
    });

    const { followers_count, follows_count, media_count } =
      profileResponse.data;

    // Fetch Instagram media posts
    const mediaResponse = await axios.get(
      `https://graph.instagram.com/me/media`,
      {
        params: {
          fields:
            "id,caption,media_type,media_url,timestamp,like_count,comments_count",
          access_token: accessToken,
        },
      }
    );

    const posts = mediaResponse.data.data;

    // Calculate monthly and yearly growth
    const now = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(now.getFullYear() - 1);

    const monthlyGrowth = [];
    const monthMap = {};

    const historicalData = await fetchHistoricalData(
      userInsights.igUserId,
      accessToken
    );

    historicalData.forEach((data) => {
      const { year, month, followersCount } = data.profileGrowth;
      monthMap[`${year}-${month}`] = followersCount;
    });

    for (let i = 0; i < 12; i++) {
      const start = new Date(oneYearAgo.getFullYear(), i, 1);
      const key = `${start.getFullYear()}-${(i + 1)
        .toString()
        .padStart(2, "0")}`;
      const followersCount = monthMap[key] || followers_count;

      monthlyGrowth.push({
        month: start.toISOString().slice(0, 7),
        followersCount,
      });
    }

    const previousYear = now.getFullYear() - 1;
    const previousYearInsights = await UserInsights.findOne({
      username,
      "profileGrowth.year": previousYear,
    });

    const previousYearFollowers = previousYearInsights
      ? previousYearInsights.followers
      : followers_count;

    const yearlyGrowth = {
      year: now.getFullYear(),
      followersGrowth: followers_count - previousYearFollowers,
    };

    const demographicInfo = {
      gender: "Not Provided",
      age_range: "Not Provided",
    };

    userInsights.followers = followers_count;
    userInsights.following = follows_count;
    userInsights.shares = posts.reduce(
      (total, post) =>
        total + (post.like_count || 0) + (post.comments_count || 0),
      0
    );
    userInsights.recentPosts = posts.map((post) => ({
      message: post.caption,
      createdTime: new Date(post.timestamp),
    }));
    userInsights.monthlyGrowth = monthlyGrowth;
    userInsights.yearlyGrowth = yearlyGrowth;
    userInsights.demographicInfo = demographicInfo;

    // Save insights
    await userInsights.save();

    return res.status(200).json(userInsights);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch insights" });
  }
}
