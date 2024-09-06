import axios from "axios";

async function fetchHistoricalData(tiktokUserId, accessToken) {
  try {
    // TikTok API URL to fetch insights
    const insightsUrl = `https://business-api.tiktok.com/open_api/v1.2/insights/get`;

    // Fetching TikTok insights (e.g., followers) for the past period
    const response = await axios.post(
      insightsUrl,
      {
        advertiser_id: tiktokUserId,
        metrics: ["follower_count"], // Example metric: follower count
        dimensions: ["time_granularity"],
        start_date: "2023-01-01", // You can dynamically set the date
        end_date: "2023-12-31",
        time_granularity: "DAY", // You can specify DAY, WEEK, or MONTH
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`, // OAuth 2.0 access token
          "Content-Type": "application/json",
        },
      }
    );

    // Parsing historical data from the API response
    const historicalData = response.data.data.list.map((data) => ({
      date: data.date,
      followersCount: data.follower_count,
    }));

    return historicalData; // Returns array of historical follower data
  } catch (error) {
    console.error("Failed to fetch historical data from TikTok:", error);
    throw new Error("Unable to fetch historical data");
  }
}
