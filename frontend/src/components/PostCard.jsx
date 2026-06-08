import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { 
  Heart, 
  MessageSquare, 
  Share2, 
  Bookmark, 
  Trash2, 
  CornerDownRight, 
  Send, 
  Clock 
} from 'lucide-react';
import { likePost, repostPost, toggleBookmark, deletePost } from '../redux/slices/feedSlice';
import api from '../utils/api';
import toast from 'react-hot-toast';

const PostCard = ({ post }) => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const [isLiked, setIsLiked] = useState(post.likes?.includes(user?.id));
  const [likesCount, setLikesCount] = useState(post.likes?.length || 0);
  const [isBookmarked, setIsBookmarked] = useState(user?.savedPosts?.includes(post._id));
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null); // comment object
  const [replyText, setReplyText] = useState('');
  const [replies, setReplies] = useState({}); // commentId -> replies array
  const [isSharing, setIsSharing] = useState(false);
  const [shareText, setShareText] = useState('');

  useEffect(() => {
    setIsLiked(post.likes?.includes(user?.id));
    setLikesCount(post.likes?.length || 0);
    setIsBookmarked(user?.savedPosts?.includes(post._id));
  }, [post.likes, post._id, user]);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);
    dispatch(likePost(post._id)).unwrap().catch(() => {
      setIsLiked(isLiked);
      setLikesCount(likesCount);
      toast.error('Failed to like post');
    });
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    dispatch(toggleBookmark(post._id)).unwrap().then(() => {
      toast.success(isBookmarked ? 'Post unsaved' : 'Post saved to bookmarks');
    }).catch(() => {
      setIsBookmarked(isBookmarked);
      toast.error('Failed to bookmark');
    });
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      dispatch(deletePost(post._id)).unwrap().then(() => {
        toast.success('Post deleted');
      }).catch(() => {
        toast.error('Failed to delete post');
      });
    }
  };

  const handleRepost = (e) => {
    e.preventDefault();
    dispatch(repostPost({ postId: post._id, content: shareText })).unwrap().then(() => {
      toast.success('Post reshared to your feed');
      setIsSharing(false);
      setShareText('');
    }).catch(() => {
      toast.error('Failed to reshare post');
    });
  };

  const loadComments = async () => {
    try {
      const res = await api.get(`/api/comments/post/${post._id}`);
      setComments(res.data.comments);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load comments');
    }
  };

  useEffect(() => {
    if (showComments) {
      loadComments();
    }
  }, [showComments]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    try {
      const res = await api.post('/api/comments', {
        postId: post._id,
        content: newCommentText,
      });
      setComments([res.data.comment, ...comments]);
      setNewCommentText('');
      toast.success('Comment added');
      // Update local comment count representation (UI trigger)
      post.commentsCount = (post.commentsCount || 0) + 1;
    } catch (err) {
      toast.error('Failed to add comment');
    }
  };

  const loadReplies = async (commentId) => {
    try {
      const res = await api.get(`/api/comments/comment/${commentId}/replies`);
      setReplies({
        ...replies,
        [commentId]: res.data.replies,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddReply = async (e, parentCommentId) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    try {
      const res = await api.post('/api/comments', {
        postId: post._id,
        content: replyText,
        parentCommentId,
      });

      const commentReplies = replies[parentCommentId] || [];
      setReplies({
        ...replies,
        [parentCommentId]: [...commentReplies, res.data.comment],
      });

      setReplyingTo(null);
      setReplyText('');
      toast.success('Reply posted');
      post.commentsCount = (post.commentsCount || 0) + 1;
    } catch (err) {
      toast.error('Failed to reply');
    }
  };

  const handleLikeComment = async (commentId, isSubReply = false, parentId = null) => {
    try {
      const res = await api.post(`/api/comments/${commentId}/like`);
      if (isSubReply && parentId) {
        const updatedReplies = replies[parentId].map((r) =>
          r._id === commentId ? { ...r, likes: res.data.likes } : r
        );
        setReplies({ ...replies, [parentId]: updatedReplies });
      } else {
        const updatedComments = comments.map((c) =>
          c._id === commentId ? { ...c, likes: res.data.likes } : c
        );
        setComments(updatedComments);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteComment = async (commentId, isSubReply = false, parentId = null) => {
    if (window.confirm('Delete comment?')) {
      try {
        await api.delete(`/api/comments/${commentId}`);
        if (isSubReply && parentId) {
          setReplies({
            ...replies,
            [parentId]: replies[parentId].filter((r) => r._id !== commentId),
          });
          post.commentsCount = Math.max(0, (post.commentsCount || 0) - 1);
        } else {
          const commentObj = comments.find(c => c._id === commentId);
          const repliesCount = commentObj?.repliesCount || 0;
          setComments(comments.filter((c) => c._id !== commentId));
          post.commentsCount = Math.max(0, (post.commentsCount || 0) - (1 + repliesCount));
        }
        toast.success('Comment removed');
      } catch (err) {
        toast.error('Failed to delete comment');
      }
    }
  };

  const formatContent = (text) => {
    if (!text) return '';
    const parts = text.split(/(\s+)/);
    return parts.map((part, index) => {
      if (part.startsWith('#')) {
        return (
          <span key={index} className="text-brand-500 font-medium hover:underline cursor-pointer">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const isAuthor = post.author?._id === user?.id || post.author === user?.id;

  return (
    <article className="bg-white dark:bg-dark-800 rounded-2xl border border-slate-100 dark:border-dark-700 shadow-sm p-5 transition-all mb-4 fade-in">
      
      {/* Post Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Link to={`/profile/${post.author?.username}`}>
            <img
              src={post.author?.avatar}
              alt={post.author?.name}
              className="h-10 w-10 rounded-xl object-cover hover:opacity-90"
            />
          </Link>
          <div>
            <Link to={`/profile/${post.author?.username}`} className="font-bold text-slate-800 dark:text-slate-100 hover:text-brand-500 text-sm">
              {post.author?.name}
            </Link>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <span>@{post.author?.username}</span>
              <span>•</span>
              <Clock className="h-3 w-3" />
              <span>
                {new Date(post.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Action Options */}
        {(isAuthor || user?.role === 'admin') && (
          <button
            onClick={handleDelete}
            className="p-2 rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/20 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Repost Metadata */}
      {post.originalPost && (
        <div className="border border-dashed border-slate-200 dark:border-dark-600 rounded-xl p-3 mb-4 bg-slate-50/50 dark:bg-dark-900/40">
          <div className="flex items-center gap-2 mb-2">
            <img
              src={post.originalPost.author?.avatar}
              alt=""
              className="h-6 w-6 rounded-lg object-cover"
            />
            <span className="text-xs font-bold dark:text-slate-200">
              {post.originalPost.author?.name}
            </span>
            <span className="text-[10px] text-slate-400">
              @{post.originalPost.author?.username}
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {formatContent(post.originalPost.content)}
          </p>
          {post.originalPost.media?.url && (
            <div className="mt-2.5 rounded-lg overflow-hidden max-h-48">
              {post.originalPost.media.type === 'video' ? (
                <video src={post.originalPost.media.url} controls className="w-full object-cover" />
              ) : (
                <img src={post.originalPost.media.url} alt="" className="w-full object-cover" />
              )}
            </div>
          )}
        </div>
      )}

      {/* Post Content */}
      <div className="mb-4">
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
          {formatContent(post.content)}
        </p>

        {/* Media Attachments */}
        {post.media?.url && (
          <div className="mt-4 rounded-2xl overflow-hidden max-h-96 border border-slate-100 dark:border-dark-700">
            {post.media.type === 'video' ? (
              <video src={post.media.url} controls className="w-full object-cover" />
            ) : (
              <img src={post.media.url} alt="Post Attachment" className="w-full object-cover" />
            )}
          </div>
        )}
      </div>

      {/* Post Actions Row */}
      <div className="flex items-center justify-between border-t border-b border-slate-50 dark:border-dark-700/50 py-3 mb-4 text-slate-500 dark:text-slate-400">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 text-xs font-semibold transition-colors hover:text-red-500 ${
            isLiked ? 'text-red-500' : ''
          }`}
        >
          <Heart className={`h-4.5 w-4.5 ${isLiked ? 'fill-red-500' : ''}`} />
          <span>{likesCount}</span>
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 text-xs font-semibold hover:text-brand-500 transition-colors"
        >
          <MessageSquare className="h-4.5 w-4.5" />
          <span>{post.commentsCount || 0}</span>
        </button>

        <button
          onClick={() => setIsSharing(!isSharing)}
          className="flex items-center gap-1.5 text-xs font-semibold hover:text-indigo-500 transition-colors"
        >
          <Share2 className="h-4.5 w-4.5" />
          <span>{post.sharesCount || 0}</span>
        </button>

        <button
          onClick={handleBookmark}
          className={`flex items-center gap-1.5 text-xs font-semibold hover:text-amber-500 transition-colors ${
            isBookmarked ? 'text-amber-500' : ''
          }`}
        >
          <Bookmark className={`h-4.5 w-4.5 ${isBookmarked ? 'fill-amber-500' : ''}`} />
        </button>
      </div>

      {/* Repost Form panel */}
      {isSharing && (
        <form onSubmit={handleRepost} className="mb-4 flex gap-2">
          <input
            type="text"
            placeholder="Add comments on share..."
            value={shareText}
            onChange={(e) => setShareText(e.target.value)}
            className="flex-grow py-2 px-3 text-xs bg-slate-50 dark:bg-dark-900 border border-slate-100 dark:border-dark-700 rounded-xl outline-none focus:border-indigo-500 text-slate-700 dark:text-slate-200"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl"
          >
            Reshare
          </button>
        </form>
      )}

      {/* Comments section */}
      {showComments && (
        <div className="space-y-4">
          {/* New Comment box */}
          <form onSubmit={handleAddComment} className="flex gap-2">
            <input
              type="text"
              placeholder="Write a comment..."
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              className="flex-grow py-2 px-3 text-xs bg-slate-50 dark:bg-dark-900 border border-slate-100 dark:border-dark-700 rounded-xl outline-none focus:border-brand-500 text-slate-750 dark:text-slate-200"
            />
            <button
              type="submit"
              className="p-2 bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-colors"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>

          {/* Comments List */}
          <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
            {comments.length === 0 ? (
              <div className="text-center py-4 text-xs text-slate-400">No comments yet.</div>
            ) : (
              comments.map((comment) => (
                <div key={comment._id} className="text-xs border-b border-slate-50 dark:border-dark-700/30 pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2.5">
                      <img
                        src={comment.author?.avatar}
                        alt=""
                        className="h-7 w-7 rounded-lg object-cover"
                      />
                      <div>
                        <span className="font-bold dark:text-slate-200">{comment.author?.name}</span>
                        <span className="text-[10px] text-slate-400 ml-1.5">@{comment.author?.username}</span>
                        <p className="text-slate-650 dark:text-slate-350 mt-1 leading-relaxed">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleLikeComment(comment._id)}
                        className={`p-1 hover:text-red-500 transition-colors ${
                          comment.likes?.includes(user?.id) ? 'text-red-500' : 'text-slate-400'
                        }`}
                      >
                        <Heart className="h-3 w-3 fill-current" />
                      </button>
                      <span className="text-[10px] text-slate-400">{comment.likes?.length || 0}</span>
                    </div>
                  </div>

                  {/* Comment Actions: Reply / Delete */}
                  <div className="flex items-center gap-3 mt-1.5 ml-9 text-[10px] text-slate-400">
                    <button onClick={() => setReplyingTo(comment)} className="hover:underline hover:text-brand-500">
                      Reply
                    </button>
                    {comment.repliesCount > 0 && (
                      <button
                        onClick={() => loadReplies(comment._id)}
                        className="hover:underline hover:text-brand-500"
                      >
                        View Replies ({comment.repliesCount})
                      </button>
                    )}
                    {(comment.author?._id === user?.id || user?.role === 'admin') && (
                      <button
                        onClick={() => handleDeleteComment(comment._id)}
                        className="hover:underline hover:text-red-500"
                      >
                        Delete
                    </button>
                  )}
                </div>

                {/* Nesting Replies */}
                {replies[comment._id] && replies[comment._id].map((reply) => (
                  <div key={reply._id} className="ml-9 mt-3 flex items-start justify-between bg-slate-50/50 dark:bg-dark-900/30 p-2.5 rounded-xl border border-slate-100 dark:border-dark-700/50">
                    <div className="flex items-start gap-2">
                      <CornerDownRight className="h-3.5 w-3.5 text-slate-400 mt-0.5" />
                      <img
                        src={reply.author?.avatar}
                        alt=""
                        className="h-6 w-6 rounded-lg object-cover"
                      />
                      <div>
                        <span className="font-bold dark:text-slate-200">{reply.author?.name}</span>
                        <span className="text-[10px] text-slate-400 ml-1.5">@{reply.author?.username}</span>
                        <p className="text-slate-650 dark:text-slate-350 mt-0.5 leading-relaxed">
                          {reply.content}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleLikeComment(reply._id, true, comment._id)}
                        className={`p-1 hover:text-red-500 transition-colors ${
                          reply.likes?.includes(user?.id) ? 'text-red-500' : 'text-slate-400'
                        }`}
                      >
                        <Heart className="h-2.5 w-2.5 fill-current" />
                      </button>
                      <span className="text-[9px] text-slate-400">{reply.likes?.length || 0}</span>
                      {(reply.author?._id === user?.id || user?.role === 'admin') && (
                        <button
                          onClick={() => handleDeleteComment(reply._id, true, comment._id)}
                          className="text-slate-400 hover:text-red-500 ml-1"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {/* Nested Reply Form */}
                {replyingTo && replyingTo._id === comment._id && (
                  <form
                    onSubmit={(e) => handleAddReply(e, comment._id)}
                    className="ml-9 mt-3 flex gap-2"
                  >
                    <input
                      type="text"
                      placeholder={`Reply to @${comment.author?.username}...`}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="flex-grow py-1.5 px-3 text-[11px] bg-slate-50 dark:bg-dark-900 border border-slate-100 dark:border-dark-700 rounded-lg outline-none focus:border-brand-500 text-slate-700 dark:text-slate-200"
                    />
                    <button
                      type="submit"
                      className="px-3 bg-brand-500 text-white text-[11px] font-bold rounded-lg"
                    >
                      Reply
                    </button>
                    <button
                      type="button"
                      onClick={() => setReplyingTo(null)}
                      className="px-2 text-slate-400 hover:text-slate-650"
                    >
                      Cancel
                    </button>
                  </form>
                )}
              </div>
            ))
          )}
          </div>
        </div>
      )}
    </article>
  );
};

export default PostCard;
