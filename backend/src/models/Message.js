const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Message sender is required'],
      index: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Message receiver is required'],
      index: true,
    },
    content: {
      type: String,
      trim: true,
      default: '',
    },
    media: {
      url: { type: String, default: '' },
      type: { type: String, enum: ['image', 'video', 'file', ''], default: '' },
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to query chat history between two users efficiently
messageSchema.index({ sender: 1, receiver: 1, createdAt: 1 });
messageSchema.index({ receiver: 1, sender: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
