const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema(
  {
    date: {
      type: String, // Format: YYYY-MM-DD
      required: true,
      unique: true,
      index: true,
    },
    totalPosts: {
      type: Number,
      default: 0,
    },
    totalLikes: {
      type: Number,
      default: 0,
    },
    totalComments: {
      type: Number,
      default: 0,
    },
    totalFollowersCount: {
      type: Number,
      default: 0,
    },
    activeUsersCount: {
      type: Number,
      default: 0,
    },
    newRegistrations: {
      type: Number,
      default: 0,
    },
    engagementRate: {
      type: Number,
      default: 0, // Calculated as: ((likes + comments + shares) / activeUsers) * 100
    },
    topPosts: [
      {
        post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
        likesCount: { type: Number, default: 0 },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Analytics', analyticsSchema);
