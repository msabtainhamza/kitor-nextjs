import mongoose from "mongoose";

const historicalDataSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    followersCount: {
      type: Number,
      required: true,
    },
    followingCount: {
      type: Number,
      required: true,
    },
    tweetsCount: {
      type: Number,
      required: true,
    },
    likesCount: {
      type: Number,
      default: 0,
    },
    retweetsCount: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const userInsightsSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  accessToken: {
    type: String,
    required: true,
  },
  followers: {
    type: Number,
    default: 0,
  },
  following: {
    type: Number,
    default: 0,
  },
  likes: {
    type: Number,
    default: 0,
  },
  retweets: {
    type: Number,
    default: 0,
  },
  tweets: {
    type: Number,
    default: 0,
  },
  monthlyGrowth: {
    type: [
      {
        month: String, // e.g., "2024-01"
        followersCount: Number,
        likesCount: Number,
        retweetsCount: Number,
        tweetsCount: Number,
      },
    ],
    default: [],
  },
  yearlyGrowth: {
    type: [
      {
        year: Number,
        followersGrowth: Number,
        likesGrowth: Number,
        retweetsGrowth: Number,
        tweetsGrowth: Number,
      },
    ],
    default: [],
  },
  demographicInfo: {
    type: {
      gender: { type: String, default: "Not Provided" },
      age_range: { type: String, default: "Not Provided" },
      country: { type: String, default: "Not Provided" },
    },
    default: {},
  },
  historicalData: {
    type: [historicalDataSchema],
    default: [],
  },
});

const UserInsights =
  mongoose.models.UserInsights ||
  mongoose.model("UserInsights", userInsightsSchema);

export default UserInsights;
