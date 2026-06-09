const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/postController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');


router.get('/feed', protect, getFeed);
router.get('/trending', protect, getTrendingPosts);
router.get('/search', protect, searchPosts);
router.get('/bookmarks', protect, getBookmarkedPosts);
router.get('/user/:username', protect, getUserPosts);


router.post('/', protect, upload.single('media'), createPost);
router.get('/:id', protect, getPostById);
router.put('/:id', protect, updatePost);
router.delete('/:id', protect, deletePost);


router.post('/:id/like', protect, likePost);
router.post('/:id/share', protect, repost);
router.post('/:id/bookmark', protect, bookmarkPost);

module.exports = router;
