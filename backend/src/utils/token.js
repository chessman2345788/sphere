const jwt = require('jsonwebtoken');

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, username: user.username, role: user.role },
    process.env.JWT_SECRET || 'supersecretjwtkey123!',
    { expiresIn: '15m' } 
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET || 'supersecretrefreshjwtkey123!',
    { expiresIn: '7d' } 
  );
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
};
