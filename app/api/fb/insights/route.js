import axios from "axios";
import db from "@/db";
import Facebook from "@/models/fb";
import { fetchHistoricalData } from "@/utils/fbHistoricalData";

export async function POST(req, res) {
  const { username } = req.json();

  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  try {
    db();

    const userInsights = await Facebook.findOne({ username });

    if (!userInsights) {
      return res.status(404).json({ error: "User not found" });
    }

    const { accessToken } = userInsights;

    // Get profile and insights from Facebook API
    const insightsResponse = await axios.get(
      `https://graph.facebook.com/me?fields=followers_count,friends_count,posts.limit(10){message,created_time,shares,comments,likes}&access_token=${accessToken}`
    );

    const { followers_count, friends_count, posts } = insightsResponse.data;

    // Fetching monthly growth
    const now = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(now.getFullYear() - 1);

    const monthlyGrowth = [];
    const monthMap = {};

    const historicalData = await fetchHistoricalData(username, accessToken);

    historicalData.forEach((data) => {
      const { year, month, followersCount } = data.profileGrowth;
      monthMap[`${year}-${month}`] = followersCount;
    });

    for (let i = 0; i < 12; i++) {
      const start = new Date(oneYearAgo.getFullYear(), i, 1);
      const end = new Date(oneYearAgo.getFullYear(), i + 1, 0);
      const key = `${start.getFullYear()}-${(i + 1)
        .toString()
        .padStart(2, "0")}`;

      const followersCount = monthMap[key] || followers_count;

      monthlyGrowth.push({
        month: start.toISOString().slice(0, 7),
        followersCount,
      });
    }

    // Fetching yearly growth
    const currentYear = new Date().getFullYear();
    const oneYearAgo2 = new Date();
    oneYearAgo2.setFullYear(currentYear - 1);

    const previousYearInsights = await UserInsights.findOne({
      username,
      "profileGrowth.year": currentYear - 1,
    });

    const previousYearFollowers = previousYearInsights
      ? previousYearInsights.followers
      : followers_count;

    const yearlyGrowth = {
      year: currentYear,
      followersGrowth: followers_count - previousYearFollowers,
    };

    // Getting demographic information
    const demographicResponse = await axios.get(
      `https://graph.facebook.com/me/insights`,
      {
        params: {
          access_token: accessToken,
          metric: "page_fans_gender_age,page_fans_country",
        },
      }
    );

    const genderAgeData = demographicResponse.data.data.find(
      (item) => item.name === "page_fans_gender_age"
    );
    const countryData = demographicResponse.data.data.find(
      (item) => item.name === "page_fans_country"
    );

    const demographicInfo = {
      gender: genderAgeData ? genderAgeData.values[0].value : "Not Provided",
      age_range: countryData ? countryData.values[0].value : "Not Provided",
    };

    userInsights.followers = followers_count;
    userInsights.following = friends_count;
    userInsights.recentPosts = posts.data.map((post) => ({
      message: post.message,
      createdTime: new Date(post.created_time),
      shares: post.shares ? post.shares.count : 0,
      comments: post.comments ? post.comments.count : 0,
      likes: post.likes ? post.likes.count : 0,
    }));
    userInsights.monthlyGrowth = monthlyGrowth;
    userInsights.yearlyGrowth = yearlyGrowth;
    userInsights.demographicInfo = demographicInfo;

    await userInsights.save();

    res.status(200).json({
      followers: followers_count,
      following: friends_count,
      posts: posts.data.map((post) => ({
        message: post.message,
        createdTime: new Date(post.created_time),
      })),
      monthlyGrowth,
      yearlyGrowth,
      demographicInfo,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch insights" });
  }
}
