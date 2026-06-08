const express = require('express');
const router = express.Router();
const { sendMessage, getChatsList, getMessageHistory, markAsRead } = require('../controllers/chatController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Chat conversations list
router.get('/list', protect, getChatsList);

// Send message (optional media upload)
router.post('/message', protect, upload.single('media'), sendMessage);

// Message history
router.get('/history/:userId', protect, getMessageHistory);

// Mark as read
router.post('/read/:userId', protect, markAsRead);

module.exports = router;
