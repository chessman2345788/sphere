const Post = require('../models/Post');
const Follower = require('../models/Follower');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { uploadMedia } = require('../config/cloudinary');
const { sendRealtimeNotification } = require('../config/socket');
const { redisClient } = require('../config/redis');




const createPost = async (req, res, next) => {
  const { content } = req.body;

  try {
    let mediaData = { url: '', type: '' };

    
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




const getFeed = async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  try {
    
    const followingUsers = await Follower.find({ follower: req.user.id }).select('following');
    const followingIds = followingUsers.map(f => f.following);
    
    
    followingIds.push(req.user.id);

    
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




const updatePost = async (req, res, next) => {
  try {
    let post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    
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




const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    
    if (post.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this post' });
    }

    
    await Post.findByIdAndDelete(req.params.id);

    
    const Comment = require('../models/Comment');
    await Comment.deleteMany({ post: req.params.id });

    
    await Notification.deleteMany({ post: req.params.id });

    res.status(200).json({ success: true, message: 'Post and associated comments removed successfully' });
  } catch (error) {
    next(error);
  }
};




const likePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const isLiked = post.likes.includes(req.user.id);
    let message = '';

    if (isLiked) {
      
      post.likes = post.likes.filter((id) => id.toString() !== req.user.id);
      message = 'Post unliked';
      
      await Notification.findOneAndDelete({
        recipient: post.author,
        sender: req.user.id,
        type: 'like',
        post: post._id,
      });
    } else {
      
      post.likes.push(req.user.id);
      message = 'Post liked';

      
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




const repost = async (req, res, next) => {
  try {
    const originalPost = await Post.findById(req.params.id);

    if (!originalPost) {
      return res.status(404).json({ success: false, message: 'Original post not found' });
    }

    
    const repostPost = await Post.create({
      author: req.user.id,
      originalPost: originalPost._id,
      content: req.body.content || '', 
    });

    
    originalPost.sharesCount += 1;
    await originalPost.save();

    
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
      
      user.savedPosts = user.savedPosts.filter(id => id.toString() !== postId);
      message = 'Post removed from bookmarks';
    } else {
      
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




const getTrendingPosts = async (req, res, next) => {
  const cacheKey = 'trending_posts';

  try {
    
    const cachedTrending = await redisClient.get(cacheKey);
    if (cachedTrending) {
      return res.status(200).json({
        success: true,
        cached: true,
        posts: JSON.parse(cachedTrending),
      });
    }

    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const posts = await Post.find({
      createdAt: { $gte: sevenDaysAgo },
    })
      .populate('author', 'name username avatar')
      .exec();

    
    const trendingPosts = posts
      .map(post => {
        const engagement = post.likes.length + (post.commentsCount || 0) + (post.sharesCount || 0);
        return { post, engagement };
      })
      .sort((a, b) => b.engagement - a.engagement)
      .slice(0, 5) 
      .map(item => item.post);

    
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
