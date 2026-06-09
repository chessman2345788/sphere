const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Post author is required'],
      index: true,
    },
    content: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1000, 'Post content cannot exceed 1000 characters'],
    },
    media: {
      url: { type: String, default: '' },
      type: { type: String, enum: ['image', 'video', ''], default: '' },
    },
    hashtags: {
      type: [String],
      default: [],
      index: true,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    sharesCount: {
      type: Number,
      default: 0,
    },
    originalPost: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      default: null,
    },
    commentsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);


postSchema.pre('save', function (next) {
  if (this.content) {
    const hashtags = this.content.match(/#\w+/g);
    this.hashtags = hashtags ? hashtags.map((tag) => tag.substring(1).toLowerCase()) : [];
  }
  next();
});

module.exports = mongoose.model('Post', postSchema);
