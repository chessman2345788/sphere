const multer = require('multer');

// Configure memory storage
const storage = multer.memoryStorage();

// File filter validation
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    // Image types
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    // Video types
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WEBP, GIF, and MP4/MPEG/QuickTime videos are allowed.'), false);
  }
};

// Size limit configuration
const limits = {
  fileSize: 20 * 1024 * 1024, // 20 MB max file size
};

const upload = multer({
  storage,
  fileFilter,
  limits,
});

module.exports = upload;
