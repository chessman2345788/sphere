const Post = require('../models/Post');
const Follower = require('../models/Follower');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { uploadMedia } = require('../config/cloudinary');
const { sendRealtimeNotification } = require('../config/socket');
const { redisClient } = require('../config/redis');

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
const createPost = async (req, res, next) => {
  const { content } = req.body;

  try {
    let mediaData = { url: '', type: '' };

    // Upload media file if present
    if (req.file) {
      const resourceType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';
      const folder = resourceType === 'video' ? 'socialsphere/videos' : 'socialsphere/posts';
      
      const result = await uploadMedia(req.file.buffer, {
        folder,
        resource_type: resourceType,
      });

      mediaData = {
        url: result.secure_url || result.url,
        type: resourceType,
      };
    }

    const post = await Post.create({
      author: req.user.id,
      content,
      media: mediaData,
    });

    const populatedPost = await Post.findById(post._id)
      .populate('author', 'name username avatar')
      .exec();

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      post: populatedPost,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get social feed (with infinite scrolling)
// @route   GET /api/posts/feed
// @access  Private
const getFeed = async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  try {
    // Get list of users the current user is following
    const followingUsers = await Follower.find({ follower: req.user.id }).select('following');
    const followingIds = followingUsers.map(f => f.following);
    
    // Include current user's posts in the feed
    followingIds.push(req.user.id);

    // Query posts
    const posts = await Post.find({ author: { $in: followingIds } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'name username avatar')
      .populate({
        path: 'originalPost',
        populate: { path: 'author', select: 'name username avatar' }
      })
      .exec();

    const total = await Post.countDocuments({ author: { $in: followingIds } });

    res.status(200).json({
      success: true,
      count: posts.length,
      page,
      totalPages: Math.ceil(total / limit),
      posts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single post details
// @route   GET /api/posts/:id
// @access  Private
const getPostById = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'name username avatar')
      .populate({
        path: 'originalPost',
        populate: { path: 'author', select: 'name username avatar' }
      })
      .exec();

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    res.status(200).json({ success: true, post });
  } catch (error) {
    next(error);
  }
};

// @desc    Update post
// @route   PUT /api/posts/:id
// @access  Private
const updatePost = async (req, res, next) => {
  try {
    let post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Ensure user is the post author or admin
    if (post.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this post' });
    }

    post.content = req.body.content || post.content;
    await post.save();

    const populatedPost = await Post.findById(post._id)
      .populate('author', 'name username avatar')
      .populate({
        path: 'originalPost',
        populate: { path: 'author', select: 'name username avatar' }
      })
      .exec();

    res.status(200).json({ success: true, message: 'Post updated successfully', post: populatedPost });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete post
// @route   DELETE /api/posts/:id
// @access  Private
const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Ensure user is post author or admin
    if (post.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this post' });
    }

    // Remove the post document
    await Post.findByIdAndDelete(req.params.id);

    // Delete any comments associated with the post
    const Comment = require('../models/Comment');
    await Comment.deleteMany({ post: req.params.id });

    // Clean up notifications referencing this post
    await Notification.deleteMany({ post: req.params.id });

    res.status(200).json({ success: true, message: 'Post and associated comments removed successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Like / Unlike post
// @route   POST /api/posts/:id/like
// @access  Private
const likePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const isLiked = post.likes.includes(req.user.id);
    let message = '';

    if (isLiked) {
      // Unlike
      post.likes = post.likes.filter((id) => id.toString() !== req.user.id);
      message = 'Post unliked';
      // Delete notification
      await Notification.findOneAndDelete({
        recipient: post.author,
        sender: req.user.id,
        type: 'like',
        post: post._id,
      });
    } else {
      // Like
      post.likes.push(req.user.id);
      message = 'Post liked';

      // Create notification if liking someone else's post
      if (post.author.toString() !== req.user.id) {
        const notification = await Notification.create({
          recipient: post.author,
          sender: req.user.id,
          type: 'like',
          post: post._id,
        });

        const populatedNotification = await Notification.findById(notification._id)
          .populate('sender', 'name username avatar')
          .populate('post', 'content')
          .exec();

        sendRealtimeNotification(post.author, populatedNotification);
      }
    }

    await post.save();

    res.status(200).json({
      success: true,
      message,
      likesCount: post.likes.length,
      likes: post.likes,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Share / Repost a post
// @route   POST /api/posts/:id/share
// @access  Private
const repost = async (req, res, next) => {
  try {
    const originalPost = await Post.findById(req.params.id);

    if (!originalPost) {
      return res.status(404).json({ success: false, message: 'Original post not found' });
    }

    // Create the repost post
    const repostPost = await Post.create({
      author: req.user.id,
      originalPost: originalPost._id,
      content: req.body.content || '', // Optional comment on share
    });

    // Increment original post's shares
    originalPost.sharesCount += 1;
    await originalPost.save();

    // Create notification for original post author
    if (originalPost.author.toString() !== req.user.id) {
      const notification = await Notification.create({
        recipient: originalPost.author,
        sender: req.user.id,
        type: 'repost',
        post: originalPost._id,
      });

      const populatedNotification = await Notification.findById(notification._id)
        .populate('sender', 'name username avatar')
        .populate('post', 'content')
        .exec();

      sendRealtimeNotification(originalPost.author, populatedNotification);
    }

    const populatedPost = await Post.findById(repostPost._id)
      .populate('author', 'name username avatar')
      .populate({
        path: 'originalPost',
        populate: { path: 'author', select: 'name username avatar' }
      })
      .exec();

    res.status(201).json({
      success: true,
      message: 'Post reshared successfully',
      post: populatedPost,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bookmark / Save a post
// @route   POST /api/posts/:id/bookmark
// @access  Private
const bookmarkPost = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const postExists = await Post.exists({ _id: postId });

    if (!postExists) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const user = await User.findById(req.user.id);
    const isBookmarked = user.savedPosts && user.savedPosts.includes(postId);

    let message = '';
    if (isBookmarked) {
      // Remove bookmark
      user.savedPosts = user.savedPosts.filter(id => id.toString() !== postId);
      message = 'Post removed from bookmarks';
    } else {
      // Add bookmark
      if (!user.savedPosts) user.savedPosts = [];
      user.savedPosts.push(postId);
      message = 'Post saved to bookmarks';
    }

    await user.save();

    res.status(200).json({
      success: true,
      message,
      savedPosts: user.savedPosts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get bookmarked posts for current user
// @route   GET /api/posts/bookmarks
// @access  Private
const getBookmarkedPosts = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .populate({
        path: 'savedPosts',
        populate: { path: 'author', select: 'name username avatar' }
      })
      .exec();

    res.status(200).json({
      success: true,
      bookmarks: user.savedPosts || [],
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Search posts by hashtag or keyword
// @route   GET /api/posts/search
// @access  Private
const searchPosts = async (req, res, next) => {
  const { q, hashtag } = req.query;
  let queryObj = {};

  if (hashtag) {
    queryObj.hashtags = hashtag.toLowerCase();
  } else if (q) {
    queryObj.content = { $regex: q, $options: 'i' };
  } else {
    return res.status(400).json({ success: false, message: 'Search term is required' });
  }

  try {
    const posts = await Post.find(queryObj)
      .sort({ createdAt: -1 })
      .populate('author', 'name username avatar')
      .populate({
        path: 'originalPost',
        populate: { path: 'author', select: 'name username avatar' }
      })
      .exec();

    res.status(200).json({ success: true, count: posts.length, posts });
  } catch (error) {
    next(error);
  }
};

// @desc    Get trending posts (using Redis caching)
// @route   GET /api/posts/trending
// @access  Private
const getTrendingPosts = async (req, res, next) => {
  const cacheKey = 'trending_posts';

  try {
    // 1. Try reading from Redis cache
    const cachedTrending = await redisClient.get(cacheKey);
    if (cachedTrending) {
      return res.status(200).json({
        success: true,
        cached: true,
        posts: JSON.parse(cachedTrending),
      });
    }

    // 2. Cache miss: query database for top liked/shared posts in past 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const posts = await Post.find({
      createdAt: { $gte: sevenDaysAgo },
    })
      .populate('author', 'name username avatar')
      .exec();

    // Sort in memory based on popularity: likes.length + commentsCount + sharesCount
    const trendingPosts = posts
      .map(post => {
        const engagement = post.likes.length + (post.commentsCount || 0) + (post.sharesCount || 0);
        return { post, engagement };
      })
      .sort((a, b) => b.engagement - a.engagement)
      .slice(0, 5) // Limit to top 5
      .map(item => item.post);

    // 3. Write to Redis cache with 5 minute expiration
    await redisClient.set(cacheKey, JSON.stringify(trendingPosts), 'EX', 300);

    res.status(200).json({
      success: true,
      cached: false,
      posts: trendingPosts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all posts by a specific user
// @route   GET /api/posts/user/:username
// @access  Private
const getUserPosts = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const posts = await Post.find({ author: user._id })
      .sort({ createdAt: -1 })
      .populate('author', 'name username avatar')
      .populate({
        path: 'originalPost',
        populate: { path: 'author', select: 'name username avatar' }
      })
      .exec();

    res.status(200).json({ success: true, count: posts.length, posts });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPost,
  getFeed,
  getPostById,
  updatePost,
  deletePost,
  likePost,
  repost,
  bookmarkPost,
  getBookmarkedPosts,
  searchPosts,
  getTrendingPosts,
  getUserPosts,
};
