const mongoose = require('mongoose');

const followerSchema = new mongoose.Schema(
  {
    follower: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Follower is required'],
    },
    following: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Following user is required'],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);


followerSchema.index({ follower: 1, following: 1 }, { unique: true });
followerSchema.index({ following: 1 });

module.exports = mongoose.model('Follower', followerSchema);
