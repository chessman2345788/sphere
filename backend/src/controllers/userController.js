const User = require('../models/User');
const Follower = require('../models/Follower');
const Post = require('../models/Post');
const Notification = require('../models/Notification');
const { uploadMedia } = require('../config/cloudinary');
const { sendRealtimeNotification } = require('../config/socket');




const getProfileByUsername = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    
    const followersCount = await Follower.countDocuments({ following: user._id });
    const followingCount = await Follower.countDocuments({ follower: user._id });

    
    const isFollowing = await Follower.exists({
      follower: req.user.id,
      following: user._id,
    });

    res.status(200).json({
      success: true,
      profile: {
        ...user.toObject(),
        followersCount,
        followingCount,
        isFollowing: !!isFollowing,
      },
    });
  } catch (error) {
    next(error);
  }
};




const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { name, bio, location, skills, interests } = req.body;

    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (location !== undefined) user.location = location;

    
    if (skills) {
      user.skills = Array.isArray(skills) ? skills : JSON.parse(skills);
    }
    if (interests) {
      user.interests = Array.isArray(interests) ? interests : JSON.parse(interests);
    }

    
    if (req.files) {
      if (req.files.avatar && req.files.avatar[0]) {
        const file = req.files.avatar[0];
        const result = await uploadMedia(file.buffer, {
          folder: 'socialsphere/avatars',
          transformation: [{ width: 300, height: 300, crop: 'limit' }],
        });
        user.avatar = result.secure_url || result.url;
      }

      if (req.files.coverImage && req.files.coverImage[0]) {
        const file = req.files.coverImage[0];
        const result = await uploadMedia(file.buffer, {
          folder: 'socialsphere/covers',
        });
        user.coverImage = result.secure_url || result.url;
      }
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user,
    });
  } catch (error) {
    next(error);
  }
};




const followUser = async (req, res, next) => {
  const targetUserId = req.params.id;

  if (targetUserId === req.user.id) {
    return res.status(400).json({ success: false, message: 'You cannot follow yourself' });
  }

  try {
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Target user not found' });
    }

    
    const alreadyFollowing = await Follower.findOne({
      follower: req.user.id,
      following: targetUserId,
    });

    if (alreadyFollowing) {
      return res.status(400).json({ success: false, message: 'You are already following this user' });
    }

    
    await Follower.create({
      follower: req.user.id,
      following: targetUserId,
    });

    
    const notification = await Notification.create({
      recipient: targetUserId,
      sender: req.user.id,
      type: 'follow',
    });

    
    const populatedNotification = await Notification.findById(notification._id)
      .populate('sender', 'name username avatar')
      .exec();

    
    sendRealtimeNotification(targetUserId, populatedNotification);

    res.status(200).json({ success: true, message: `Successfully followed ${targetUser.name}` });
  } catch (error) {
    next(error);
  }
};




const unfollowUser = async (req, res, next) => {
  const targetUserId = req.params.id;

  try {
    const deleted = await Follower.findOneAndDelete({
      follower: req.user.id,
      following: targetUserId,
    });

    if (!deleted) {
      return res.status(400).json({ success: false, message: 'You were not following this user' });
    }

    
    await Notification.findOneAndDelete({
      recipient: targetUserId,
      sender: req.user.id,
      type: 'follow',
    });

    res.status(200).json({ success: true, message: 'Successfully unfollowed user' });
  } catch (error) {
    next(error);
  }
};




const getFollowers = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const followers = await Follower.find({ following: user._id })
      .populate('follower', 'name username avatar bio')
      .exec();

    res.status(200).json({ success: true, followers: followers.map(f => f.follower) });
  } catch (error) {
    next(error);
  }
};




const getFollowing = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const following = await Follower.find({ follower: user._id })
      .populate('following', 'name username avatar bio')
      .exec();

    res.status(200).json({ success: true, following: following.map(f => f.following) });
  } catch (error) {
    next(error);
  }
};




const searchUsers = async (req, res, next) => {
  const query = req.query.q;

  if (!query) {
    return res.status(400).json({ success: false, message: 'Search query is required' });
  }

  try {
    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { username: { $regex: query, $options: 'i' } },
      ],
      _id: { $ne: req.user.id }, 
    })
      .limit(10)
      .select('name username avatar bio');

    res.status(200).json({ success: true, users });
  } catch (error) {
    next(error);
  }
};




const getProfileAnalytics = async (req, res, next) => {
  try {
    const userId = req.user.id;

    
    const userPosts = await Post.find({ author: userId });
    const totalPosts = userPosts.length;

    
    let totalLikes = 0;
    let totalComments = 0;
    userPosts.forEach(post => {
      totalLikes += post.likes.length;
      totalComments += post.commentsCount || 0;
    });

    const followersCount = await Follower.countDocuments({ following: userId });
    const followingCount = await Follower.countDocuments({ follower: userId });

    
    
    let engagementRate = 0;
    if (followersCount > 0 && totalPosts > 0) {
      engagementRate = (((totalLikes + totalComments) / followersCount) / totalPosts) * 100;
    }

    res.status(200).json({
      success: true,
      analytics: {
        totalPosts,
        totalLikes,
        totalComments,
        followersCount,
        followingCount,
        engagementRate: Math.round(engagementRate * 100) / 100, 
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfileByUsername,
  updateProfile,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  searchUsers,
  getProfileAnalytics,
};
