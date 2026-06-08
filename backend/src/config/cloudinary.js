const cloudinary = require('cloudinary').v2;

const isConfigured = 
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name' &&
  process.env.CLOUDINARY_CLOUD_NAME !== 'mock_cloudinary';

if (isConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log('✅ Cloudinary Configured Successfully');
} else {
  console.log('⚠️ Cloudinary not configured. Using mock uploader.');
}

/**
 * Upload a file buffer or path to Cloudinary, with mock fallback.
 * @param {string|Buffer} file - Path to file or file buffer
 * @param {object} options - Cloudinary upload options
 * @returns {Promise<{url: string, secure_url: string, resource_type: string}>}
 */
const uploadMedia = async (file, options = {}) => {
  if (isConfigured) {
    return new Promise((resolve, reject) => {
      // If file is buffer, use upload_stream
      if (Buffer.isBuffer(file)) {
        const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
          if (error) reject(error);
          else resolve(result);
        });
        stream.end(file);
      } else {
        // If file is string path
        cloudinary.uploader.upload(file, options)
          .then(result => resolve(result))
          .catch(err => reject(err));
      }
    });
  } else {
    // Mock upload delay and response
    await new Promise((resolve) => setTimeout(resolve, 500));
    const resourceType = options.resource_type || 'image';
    
    if (resourceType === 'video') {
      return {
        url: 'https://res.cloudinary.com/demo/video/upload/dog.mp4',
        secure_url: 'https://res.cloudinary.com/demo/video/upload/dog.mp4',
        resource_type: 'video',
      };
    }
    
    // Return a random beautiful unsplash or cloudinary sample image
    const images = [
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?w=800&auto=format&fit=crop&q=80'
    ];
    const randomImg = images[Math.floor(Math.random() * images.length)];

    return {
      url: randomImg,
      secure_url: randomImg,
      resource_type: 'image',
    };
  }
};

module.exports = {
  cloudinary,
  uploadMedia,
  isMock: () => !isConfigured,
};
