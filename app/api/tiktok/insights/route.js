import axios from "axios";
import mongoose from "mongoose";
import UserInsights from "@/models/tiktok";
import { fetchHistoricalData } from "@/utils/tiktokHistoricalData";

export async function POST(req, res) {
  const { username } = req.json();

  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  try {
    // Connect to MongoDB if not already connected
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    const userInsights = await UserInsights.findOne({ username });

    if (!userInsights) {
      return res.status(404).json({ error: "User not found" });
    }

    const { accessToken } = userInsights;

    // Fetch user stats
    const insightsResponse = await axios.get(
      "https://open-api.tiktok.com/user/stats/",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const {
      followers_count,
      following_count,
      views_count,
      likes_count,
      shares_count,
    } = insightsResponse.data;

    // Monthly and yearly growth logic
    const now = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(now.getFullYear() - 1);

    const monthlyGrowth = [];
    const monthMap = {};

    const historicalData = await fetchHistoricalData(username, accessToken);

    historicalData.forEach((data) => {
      data.monthlyGrowth.forEach((monthData) => {
        const { month, followersCount, likesCount, viewsCount } = monthData;
        monthMap[`${month}`] = { followersCount, likesCount, viewsCount };
      });
    });

    for (let i = 0; i < 12; i++) {
      const start = new Date(oneYearAgo.getFullYear(), i, 1);
      const key = `${start.toISOString().slice(0, 7)}`;

      const growthData = monthMap[key] || {
        followersCount: followers_count,
        likesCount: likes_count,
        viewsCount: views_count,
      };

      monthlyGrowth.push({
        month: start.toISOString().slice(0, 7),
        followersCount: growthData.followersCount,
        likesCount: growthData.likesCount,
        viewsCount: growthData.viewsCount,
      });
    }

    const currentYear = new Date().getFullYear();
    const previousYearData = await UserInsights.findOne({
      username,
      "yearlyGrowth.year": currentYear - 1,
    });

    const previousYearFollowers = previousYearData
      ? previousYearData.followers
      : followers_count;

    const yearlyGrowth = {
      year: currentYear,
      followersGrowth: followers_count - previousYearFollowers,
      likesGrowth:
        likes_count - (previousYearData ? previousYearData.likes : likes_count),
      viewsGrowth:
        views_count - (previousYearData ? previousYearData.views : views_count),
    };

    const demographicResponse = await axios.get(
      "https://open-api.tiktok.com/user/demographics/",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const demographicInfo = {
      gender: demographicResponse.data.gender || "Not Provided",
      age_range: demographicResponse.data.age_range || "Not Provided",
      country: demographicResponse.data.country || "Not Provided",
    };

    // Update user insights
    userInsights.followers = followers_count;
    userInsights.following = following_count;
    userInsights.views = views_count;
    userInsights.likes = likes_count;
    userInsights.shares = shares_count;
    userInsights.demographicInfo = demographicInfo;
    userInsights.monthlyGrowth = monthlyGrowth;
    userInsights.yearlyGrowth = yearlyGrowth;

    await userInsights.save();

    res.status(200).json(userInsights);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch insights" });
  }
}
