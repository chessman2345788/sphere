const express = require('express');
const router = express.Router();
const {
  getProfileByUsername,
  updateProfile,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  searchUsers,
  getProfileAnalytics,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');


router.get('/search', protect, searchUsers);


router.get('/profile-analytics', protect, getProfileAnalytics);

router.get('/profile/:username', protect, getProfileByUsername);
router.put(
  '/profile',
  protect,
  upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 },
  ]),
  updateProfile
);

router.post('/follow/:id', protect, followUser);
router.post('/unfollow/:id', protect, unfollowUser);

router.get('/:username/followers', protect, getFollowers);
router.get('/:username/following', protect, getFollowing);

module.exports = router;
