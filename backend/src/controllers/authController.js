const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { generateAccessToken, generateRefreshToken } = require('../utils/token');




const register = async (req, res, next) => {
  const { name, username, email, password } = req.body;

  try {
    
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'Username or email already in use' });
    }

    
    const user = await User.create({
      name,
      username,
      email,
      password,
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    
    user.refreshTokens.push(refreshToken);
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    next(error);
  }
};




const login = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide email and password' });
  }

  try {
    
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    
    user.refreshTokens.push(refreshToken);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    next(error);
  }
};




const logout = async (req, res, next) => {
  const { refreshToken } = req.body;

  try {
    if (refreshToken) {
      
      await User.updateOne(
        { _id: req.user.id },
        { $pull: { refreshTokens: refreshToken } }
      );
    }

    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};




const refreshToken = async (req, res, next) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ success: false, message: 'Refresh token is required' });
  }

  try {
    
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'supersecretrefreshjwtkey123!');

    
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid token user' });
    }

    
    const tokenIndex = user.refreshTokens.indexOf(refreshToken);
    if (tokenIndex === -1) {
      
      user.refreshTokens = [];
      await user.save();
      return res.status(403).json({
        success: false,
        message: 'Potential token reuse detected. All sessions terminated. Please login again.',
      });
    }

    
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    
    user.refreshTokens[tokenIndex] = newRefreshToken;
    await user.save();

    res.status(200).json({
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error('Refresh token validation error:', error.message);
    res.status(401).json({ success: false, message: 'Refresh token expired or invalid' });
  }
};




const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  getMe,
};
