import axios from "axios";
import db from "@/db";
import UserInsights from "@/models/twitter";
import { updateTwitterHistoricalData } from "@/utils/twitterHistoricalData";

export async function POST(request) {
  const body = await request.json();
  const { username } = body;

  if (!username) {
    return new Response(JSON.stringify({ error: "Username is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    await db();

    const userInsights = await UserInsights.findOne({ username });

    if (!userInsights) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { accessToken } = userInsights;

    // Fetch user data
    const userDataResponse = await axios.get(
      `https://api.twitter.com/2/users/by/username/${username}?user.fields=public_metrics,location`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    const userData = userDataResponse.data.data;
    const {
      public_metrics: {
        followers_count,
        following_count,
        tweet_count,
        listed_count,
      },
      location,
      id: userId,
    } = userData;

    await updateTwitterHistoricalData(username, accessToken);

    const tweetsResponse = await axios.get(
      `https://api.twitter.com/2/users/${userId}/tweets?tweet.fields=public_metrics`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    const tweets = tweetsResponse.data.data;

    // Calculate total likes and retweets
    let likes_count = 0;
    let retweets_count = 0;

    tweets.forEach((tweet) => {
      const { like_count, retweet_count } = tweet.public_metrics;
      likes_count += like_count;
      retweets_count += retweet_count;
    });

    // Historical Growth Calculation
    const now = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(now.getFullYear() - 1);

    const monthlyGrowth = [];
    const yearlyGrowth = [];

    // Fetch historical data
    const historicalData = userInsights.historicalData.filter(
      (data) => new Date(data.date) >= oneYearAgo
    );

    // Calculate Monthly Growth
    for (let i = 0; i < 12; i++) {
      const month = new Date(
        oneYearAgo.getFullYear(),
        oneYearAgo.getMonth() + i,
        1
      );
      const nextMonth = new Date(
        oneYearAgo.getFullYear(),
        oneYearAgo.getMonth() + i + 1,
        1
      );

      const monthlyData = historicalData.filter(
        (data) =>
          new Date(data.date) >= month && new Date(data.date) < nextMonth
      );

      const startCount =
        monthlyData.length > 0
          ? monthlyData[0].followersCount
          : followers_count;
      const endCount =
        monthlyData.length > 0
          ? monthlyData[monthlyData.length - 1].followersCount
          : followers_count;

      monthlyGrowth.push({
        month: month.toISOString().slice(0, 7),
        startFollowersCount: startCount,
        endFollowersCount: endCount,
        growth: endCount - startCount,
      });
    }

    // Calculate Yearly Growth
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear(), 11, 31);

    const yearlyData = historicalData.filter(
      (data) =>
        new Date(data.date) >= startOfYear && new Date(data.date) <= endOfYear
    );

    const startYearCount =
      yearlyData.length > 0 ? yearlyData[0].followersCount : followers_count;
    const endYearCount =
      yearlyData.length > 0
        ? yearlyData[yearlyData.length - 1].followersCount
        : followers_count;

    yearlyGrowth.push({
      year: now.getFullYear(),
      startFollowersCount: startYearCount,
      endFollowersCount: endYearCount,
      growth: endYearCount - startYearCount,
    });

    const demographicInfo = {
      gender: "Not Provided",
      age_range: "Not Provided",
      country: location || "Not Provided",
    };

    // Update user insights in the database
    userInsights.followers = followers_count;
    userInsights.following = following_count;
    userInsights.likes = likes_count;
    userInsights.retweets = retweets_count;
    userInsights.tweets = tweet_count;
    userInsights.monthlyGrowth = monthlyGrowth;
    userInsights.yearlyGrowth = yearlyGrowth;
    userInsights.demographicInfo = demographicInfo;

    // Add to historical data
    userInsights.historicalData.push({
      date: now,
      followersCount: followers_count,
      likesCount: likes_count,
      retweetsCount: retweets_count,
      tweetsCount: tweet_count,
    });

    await userInsights.save();

    return new Response(JSON.stringify(userInsights), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Insights Error:", error.response?.data || error.message);
    return new Response(JSON.stringify({ error: "Failed to fetch insights" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
