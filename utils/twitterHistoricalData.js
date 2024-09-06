import axios from "axios";
import UserInsights from "@/models/twitter";
import mongoose from "mongoose"; // Ensure mongoose is imported

export async function updateTwitterHistoricalData(username, accessToken) {
  try {
    // Ensure a MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    // Find the user in the database
    const userInsights = await UserInsights.findOne({ username });

    if (!userInsights) {
      throw new Error("User not found");
    }

    // Fetch user profile details from Twitter
    const profileResponse = await axios.get(
      `https://api.twitter.com/2/users/by/username/${username}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const userProfile = profileResponse.data.data;
    const { id: userId, public_metrics } = userProfile;
    const { followers_count, following_count, tweet_count } = public_metrics;

    // Fetch recent tweets for likes and retweets count
    const tweetsResponse = await axios.get(
      `https://api.twitter.com/2/users/${userId}/tweets`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          "tweet.fields": "public_metrics", // to include retweets, likes, etc.
          max_results: 100, // Fetch the most recent 100 tweets
        },
      }
    );

    let totalLikes = 0;
    let totalRetweets = 0;
    const tweets = tweetsResponse.data.data;

    // Loop through tweets to sum up likes and retweets
    tweets.forEach((tweet) => {
      totalLikes += tweet.public_metrics.like_count;
      totalRetweets += tweet.public_metrics.retweet_count;
    });

    // Prepare the historical data entry
    const today = new Date();
    const historicalEntry = {
      date: today,
      followersCount: followers_count,
      followingCount: following_count,
      tweetsCount: tweet_count,
      likesCount: totalLikes,
      retweetsCount: totalRetweets,
    };

    // Update the userInsights document with historical data
    userInsights.monthlyGrowth.push(historicalEntry);
    await userInsights.save();
  } catch (error) {
    console.error("Failed to update historical data for Twitter:", error);
  }
}
