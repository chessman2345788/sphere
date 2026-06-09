const express = require('express');
const router = express.Router();
const { sendMessage, getChatsList, getMessageHistory, markAsRead } = require('../controllers/chatController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');


router.get('/list', protect, getChatsList);


router.post('/message', protect, upload.single('media'), sendMessage);


router.get('/history/:userId', protect, getMessageHistory);


router.post('/read/:userId', protect, markAsRead);

module.exports = router;
