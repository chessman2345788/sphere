const Message = require('../models/Message');
const User = require('../models/User');
const { uploadMedia } = require('../config/cloudinary');
const { sendRealtimeChat, getIO } = require('../config/socket');
const mongoose = require('mongoose');




const sendMessage = async (req, res, next) => {
  const { receiverId, content } = req.body;

  if (!receiverId) {
    return res.status(400).json({ success: false, message: 'Receiver ID is required' });
  }

  try {
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ success: false, message: 'Receiver user not found' });
    }

    let mediaData = { url: '', type: '' };

    
    if (req.file) {
      const resourceType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';
      const folder = 'socialsphere/chats';
      const result = await uploadMedia(req.file.buffer, {
        folder,
        resource_type: resourceType,
      });

      mediaData = {
        url: result.secure_url || result.url,
        type: resourceType,
      };
    }

    
    const message = await Message.create({
      sender: req.user.id,
      receiver: receiverId,
      content: content || '',
      media: mediaData,
    });

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name username avatar')
      .populate('receiver', 'name username avatar')
      .exec();

    
    sendRealtimeChat(receiverId, populatedMessage);

    res.status(201).json({
      success: true,
      message: populatedMessage,
    });
  } catch (error) {
    next(error);
  }
};




const getChatsList = async (req, res, next) => {
  const userId = new mongoose.Types.ObjectId(req.user.id);
  
  try {
    
    const chats = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: userId }, { receiver: userId }],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', userId] },
              '$receiver',
              '$sender',
            ],
          },
          lastMessage: { $first: '$$ROOT' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'partner',
        },
      },
      {
        $unwind: '$partner',
      },
      {
        $project: {
          _id: 0,
          partner: {
            _id: 1,
            name: 1,
            username: 1,
            avatar: 1,
          },
          lastMessage: 1,
        },
      },
      {
        $sort: { 'lastMessage.createdAt': -1 },
      },
    ]);

    
    const chatsWithUnread = await Promise.all(
      chats.map(async (chat) => {
        const unreadCount = await Message.countDocuments({
          sender: chat.partner._id,
          receiver: userId,
          isRead: false,
        });
        return {
          ...chat,
          unreadCount,
        };
      })
    );

    res.status(200).json({ success: true, chats: chatsWithUnread });
  } catch (error) {
    next(error);
  }
};




const getMessageHistory = async (req, res, next) => {
  const currentUserId = req.user.id;
  const partnerUserId = req.params.userId;
  
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 30;
  const skip = (page - 1) * limit;

  try {
    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: partnerUserId },
        { sender: partnerUserId, receiver: currentUserId },
      ],
    })
      .sort({ createdAt: -1 }) 
      .skip(skip)
      .limit(limit)
      .populate('sender', 'name username avatar')
      .populate('receiver', 'name username avatar')
      .exec();

    const total = await Message.countDocuments({
      $or: [
        { sender: currentUserId, receiver: partnerUserId },
        { sender: partnerUserId, receiver: currentUserId },
      ],
    });

    res.status(200).json({
      success: true,
      messages: messages.reverse(), 
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};




const markAsRead = async (req, res, next) => {
  const currentUserId = req.user.id;
  const senderId = req.params.userId;

  try {
    
    await Message.updateMany(
      { sender: senderId, receiver: currentUserId, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );

    
    const io = getIO();
    io.to(senderId).emit('messages_read', { readerId: currentUserId });

    res.status(200).json({ success: true, message: 'Messages marked as read' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendMessage,
  getChatsList,
  getMessageHistory,
  markAsRead,
};
