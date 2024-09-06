import axios from "axios";

// Function to fetch historical data (e.g., followers) for an Instagram Business/Creator account
export async function fetchHistoricalData(igUserId, accessToken) {
  try {
    // Instagram Graph API URL to fetch insights
    const insightsUrl = `https://graph.facebook.com/v16.0/${igUserId}/insights`;

    // Fetching Instagram insights (e.g., follower count) for the past period
    const response = await axios.get(insightsUrl, {
      params: {
        metric: "follower_count", // Available metrics: "follower_count", "impressions", "reach", etc.
        period: "day", // You can also use "week", "month" for different intervals
        access_token: accessToken,
      },
    });

    // Parsing historical data from the API response
    const historicalData = response.data.data[0].values.map((data) => ({
      date: data.end_time,
      followersCount: data.value, // 'value' represents the follower count on a specific day
    }));

    return historicalData; // Returns array of historical follower data
  } catch (error) {
    console.error("Failed to fetch historical data from Instagram:", error);
    throw new Error("Unable to fetch historical data");
  }
}
