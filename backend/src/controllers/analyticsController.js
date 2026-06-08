const Post = require('../models/Post');
const Comment = require('../models/Comment');
const User = require('../models/User');
const Follower = require('../models/Follower');

// @desc    Get dashboard analytics (Total counts, engagement, trends)
// @route   GET /api/analytics/dashboard
// @access  Private
const getDashboardAnalytics = async (req, res, next) => {
  try {
    // 1. Core Platform Counts
    const totalPosts = await Post.countDocuments();
    const totalComments = await Comment.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalFollowersCount = await Follower.countDocuments();

    // 2. Sum up all likes across posts
    const postsLikesSum = await Post.aggregate([
      {
        $group: {
          _id: null,
          totalLikes: { $sum: { $size: '$likes' } },
        },
      },
    ]);
    const totalLikes = postsLikesSum.length > 0 ? postsLikesSum[0].totalLikes : 0;

    // 3. Platform-wide average engagement rate
    // Formula: ((likes + comments) / totalUsers)
    let overallEngagementRate = 0;
    if (totalUsers > 0) {
      overallEngagementRate = ((totalLikes + totalComments) / totalUsers);
    }

    // 4. Calculate activity trends over the last 7 days
    const activityTrends = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));

      const postsCount = await Post.countDocuments({ createdAt: { $gte: startOfDay, $lte: endOfDay } });
      const commentsCount = await Comment.countDocuments({ createdAt: { $gte: startOfDay, $lte: endOfDay } });
      
      // Get likes count during this day
      const dailyPosts = await Post.find({ createdAt: { $gte: startOfDay, $lte: endOfDay } }).select('likes');
      let dailyLikes = 0;
      dailyPosts.forEach(p => { dailyLikes += p.likes.length; });

      // Format date label as "Mon", "Tue", etc.
      const label = startOfDay.toLocaleDateString('en-US', { weekday: 'short' });
      activityTrends.push({
        label,
        date: startOfDay.toISOString().split('T')[0],
        posts: postsCount,
        likes: dailyLikes,
        comments: commentsCount,
      });
    }

    // 5. Retrieve top 5 most liked posts
    const topPosts = await Post.find()
      .populate('author', 'name username avatar')
      .exec();
    
    const sortedTopPosts = topPosts
      .map(p => ({
        _id: p._id,
        content: p.content,
        author: p.author,
        likesCount: p.likes.length,
        commentsCount: p.commentsCount,
        createdAt: p.createdAt,
      }))
      .sort((a, b) => b.likesCount - a.likesCount)
      .slice(0, 5);

    res.status(200).json({
      success: true,
      analytics: {
        totalPosts,
        totalLikes,
        totalComments,
        totalUsers,
        totalFollowersCount,
        engagementRate: Math.round(overallEngagementRate * 100) / 100,
        activityTrends,
        topPosts: sortedTopPosts,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardAnalytics,
};
