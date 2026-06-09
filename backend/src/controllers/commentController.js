const Comment = require('../models/Comment');
const Post = require('../models/Post');
const Notification = require('../models/Notification');
const { sendRealtimeNotification } = require('../config/socket');




const createComment = async (req, res, next) => {
  const { postId, content, parentCommentId } = req.body;

  if (!postId || !content) {
    return res.status(400).json({ success: false, message: 'Post ID and content are required' });
  }

  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    let parentComment = null;
    if (parentCommentId) {
      parentComment = await Comment.findById(parentCommentId);
      if (!parentComment) {
        return res.status(404).json({ success: false, message: 'Parent comment not found' });
      }
    }

    
    const comment = await Comment.create({
      post: postId,
      author: req.user.id,
      content,
      parentComment: parentCommentId || null,
    });

    
    post.commentsCount += 1;
    await post.save();

    
    const populatedComment = await Comment.findById(comment._id)
      .populate('author', 'name username avatar')
      .exec();

    
    if (post.author.toString() !== req.user.id && !parentCommentId) {
      const notification = await Notification.create({
        recipient: post.author,
        sender: req.user.id,
        type: 'comment',
        post: post._id,
        comment: comment._id,
      });

      const populatedNotification = await Notification.findById(notification._id)
        .populate('sender', 'name username avatar')
        .populate('post', 'content')
        .exec();

      sendRealtimeNotification(post.author, populatedNotification);
    }

    
    if (parentComment && parentComment.author.toString() !== req.user.id) {
      const notification = await Notification.create({
        recipient: parentComment.author,
        sender: req.user.id,
        type: 'comment', 
        post: post._id,
        comment: comment._id,
      });

      const populatedNotification = await Notification.findById(notification._id)
        .populate('sender', 'name username avatar')
        .populate('post', 'content')
        .exec();

      sendRealtimeNotification(parentComment.author, populatedNotification);
    }

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      comment: populatedComment,
    });
  } catch (error) {
    next(error);
  }
};




const getCommentsByPost = async (req, res, next) => {
  try {
    
    const comments = await Comment.find({ post: req.params.postId, parentComment: null })
      .sort({ createdAt: -1 })
      .populate('author', 'name username avatar')
      .exec();

    
    const commentsWithReplyCounts = await Promise.all(
      comments.map(async (comment) => {
        const repliesCount = await Comment.countDocuments({ parentComment: comment._id });
        return {
          ...comment.toObject(),
          repliesCount,
        };
      })
    );

    res.status(200).json({ success: true, count: comments.length, comments: commentsWithReplyCounts });
  } catch (error) {
    next(error);
  }
};




const getRepliesByComment = async (req, res, next) => {
  try {
    const replies = await Comment.find({ parentComment: req.params.commentId })
      .sort({ createdAt: 1 }) 
      .populate('author', 'name username avatar')
      .exec();

    res.status(200).json({ success: true, count: replies.length, replies });
  } catch (error) {
    next(error);
  }
};




const likeComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    const isLiked = comment.likes.includes(req.user.id);
    let message = '';

    if (isLiked) {
      comment.likes = comment.likes.filter((id) => id.toString() !== req.user.id);
      message = 'Comment unliked';
    } else {
      comment.likes.push(req.user.id);
      message = 'Comment liked';
    }

    await comment.save();

    res.status(200).json({
      success: true,
      message,
      likesCount: comment.likes.length,
      likes: comment.likes,
    });
  } catch (error) {
    next(error);
  }
};




const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    
    if (comment.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this comment' });
    }

    const post = await Post.findById(comment.post);

    
    const repliesCount = await Comment.countDocuments({ parentComment: comment._id });
    const totalDeleted = 1 + repliesCount;

    
    await Comment.findByIdAndDelete(req.params.id);
    
    await Comment.deleteMany({ parentComment: comment._id });

    
    if (post) {
      post.commentsCount = Math.max(0, post.commentsCount - totalDeleted);
      await post.save();
    }

    
    await Notification.deleteMany({ comment: req.params.id });

    res.status(200).json({ success: true, message: 'Comment and replies removed successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createComment,
  getCommentsByPost,
  getRepliesByComment,
  likeComment,
  deleteComment,
};
