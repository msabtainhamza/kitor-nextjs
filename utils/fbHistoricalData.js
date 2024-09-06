import axios from "axios";

// This function fetches historical data (e.g., followers) for a Facebook user
export async function fetchHistoricalData(username, accessToken) {
  try {
    const insightsUrl = `https://graph.facebook.com/v16.0/${username}/insights`;

    // Making an API request to get Facebook page/user insights
    const response = await axios.get(insightsUrl, {
      params: {
        metric: "page_fans", // Example metric: "page_fans" represents total likes/followers
        period: "day", // You can also use "week", "month", etc., to get different time intervals
        access_token: accessToken,
      },
    });

    // Response will include historical data for each day (or time period specified)
    const historicalData = response.data.data[0].values.map((data) => ({
      date: data.end_time,
      followersCount: data.value, // 'value' represents the follower count for that day
    }));

    return historicalData; // Returns the array of historical follower data
  } catch (error) {
    console.error("Failed to fetch historical data from Facebook:", error);
    throw new Error("Unable to fetch historical data");
  }
}
