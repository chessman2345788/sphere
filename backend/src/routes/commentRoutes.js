const express = require('express');
const router = express.Router();
const {
  createComment,
  getCommentsByPost,
  getRepliesByComment,
  likeComment,
  deleteComment,
} = require('../controllers/commentController');
const { protect } = require('../middleware/auth');

router.post('/', protect, createComment);
router.get('/post/:postId', protect, getCommentsByPost);
router.get('/comment/:commentId/replies', protect, getRepliesByComment);
router.post('/:id/like', protect, likeComment);
router.delete('/:id', protect, deleteComment);

module.exports = router;
