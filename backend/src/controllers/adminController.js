const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Follower = require('../models/Follower');
const Notification = require('../models/Notification');
const Message = require('../models/Message');




const getAllUsers = async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  try {
    const users = await User.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('name username email role avatar createdAt');

    const total = await User.countDocuments();

    
    const usersWithStats = await Promise.all(
      users.map(async (u) => {
        const postsCount = await Post.countDocuments({ author: u._id });
        const followersCount = await Follower.countDocuments({ following: u._id });
        return {
          ...u.toObject(),
          postsCount,
          followersCount,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: users.length,
      page,
      totalPages: Math.ceil(total / limit),
      users: usersWithStats,
    });
  } catch (error) {
    next(error);
  }
};




const updateUserRole = async (req, res, next) => {
  const { role } = req.body;

  if (!role || !['user', 'admin'].includes(role)) {
    return res.status(400).json({ success: false, message: 'Please provide a valid role (user or admin)' });
  }

  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    
    if (user._id.toString() === req.user.id && role === 'user') {
      return res.status(400).json({ success: false, message: 'You cannot demote yourself from admin role' });
    }

    user.role = role;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User role updated to ${role} successfully`,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};




const deleteUser = async (req, res, next) => {
  const userId = req.params.id;

  if (userId === req.user.id) {
    return res.status(400).json({ success: false, message: 'You cannot delete your own admin account' });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    
    await Post.deleteMany({ author: userId });

    
    await Comment.deleteMany({ author: userId });

    
    await Follower.deleteMany({ $or: [{ follower: userId }, { following: userId }] });

    
    await Notification.deleteMany({ $or: [{ recipient: userId }, { sender: userId }] });

    
    await Message.deleteMany({ $or: [{ sender: userId }, { receiver: userId }] });

    
    await User.findByIdAndDelete(userId);

    res.status(200).json({ success: true, message: 'User account and all associated contents purged successfully' });
  } catch (error) {
    next(error);
  }
};




const deletePostModeration = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    
    await Post.findByIdAndDelete(req.params.id);

    
    await Comment.deleteMany({ post: req.params.id });

    
    await Notification.deleteMany({ post: req.params.id });

    res.status(200).json({ success: true, message: 'Post removed by administrator' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  updateUserRole,
  deleteUser,
  deletePostModeration,
};
