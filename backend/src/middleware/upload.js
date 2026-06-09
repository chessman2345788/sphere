const multer = require('multer');


const storage = multer.memoryStorage();


const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    
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


const limits = {
  fileSize: 20 * 1024 * 1024, 
};

const upload = multer({
  storage,
  fileFilter,
  limits,
});

module.exports = upload;
