import mongoose from "mongoose";

const youtubeInsightsSchema = new mongoose.Schema(
  {
    channelName: {
      type: String,
      required: true,
      unique: true,
    },
    subscribers: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
    shares: {
      type: Number,
      default: 0,
    },
    videos: {
      type: Number,
      default: 0,
    },
    past10Videos: {
      type: [
        {
          videoId: String,
          title: String,
          views: Number,
          likes: Number,
          shares: Number,
          uploadDate: Date,
        },
      ],
      default: [],
    },
    demographicData: {
      type: {
        ageRange: { type: String, default: "Not Provided" },
        gender: { type: String, default: "Not Provided" },
        location: { type: String, default: "Not Provided" },
      },
      default: {},
    },
    monthlyGrowth: {
      type: [
        {
          month: String, // e.g., "2024-01"
          subscribersCount: Number,
          viewsCount: Number,
          sharesCount: Number,
          videosCount: Number,
        },
      ],
      default: [],
    },
    yearlyGrowth: {
      type: [
        {
          year: Number,
          subscribersGrowth: Number,
          viewsGrowth: Number,
          sharesGrowth: Number,
          videosGrowth: Number,
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

const YoutubeInsights =
  mongoose.models.YoutubeInsights ||
  mongoose.model("YoutubeInsights", youtubeInsightsSchema);

export default YoutubeInsights;
