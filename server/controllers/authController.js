import { User } from '../models/index.js';
import { generateTokens, verifyRefreshToken } from '../utils/jwt.js';
import { UserRoles } from '../constants.js';

export const registerStudent = async (req, res) => {
  try {
    const { username, email, password, firstName, lastName } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });
    
    if (existingUser) {
      return res.status(400).json({
        message: 'User with this email or username already exists'
      });
    }
    
    // Create new student user
    const user = new User({
      username,
      email,
      password,
      role: UserRoles.STUDENT,
      profile: {
        firstName,
        lastName
      }
    });
    
    await user.save();
    
    // Generate tokens
    const tokens = generateTokens({ 
      userId: user._id, 
      role: user.role 
    });
    
    res.status(201).json({
      message: 'Student registered successfully',
      user,
      ...tokens
    });
  } catch (error) {
    res.status(500).json({
      message: 'Registration failed',
      error: error.message
    });
  }
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find user by username or email
    const user = await User.findOne({
      $or: [{ username }, { email: username }]
    });
    
    if (!user) {
      return res.status(401).json({
        message: 'Invalid credentials'
      });
    }
    
    // Check password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Invalid credentials'
      });
    }
    
    // Check if user is active
    if (user.status !== 'active') {
      return res.status(401).json({
        message: 'Account is not active'
      });
    }
    
    // Generate tokens
    const tokens = generateTokens({ 
      userId: user._id, 
      role: user.role 
    });
    
    res.json({
      message: 'Login successful',
      user,
      ...tokens
    });
  } catch (error) {
    res.status(500).json({
      message: 'Login failed',
      error: error.message
    });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({
        message: 'Refresh token required'
      });
    }
    
    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user || user.status !== 'active') {
      return res.status(401).json({
        message: 'Invalid refresh token'
      });
    }
    
    // Generate new tokens
    const tokens = generateTokens({ 
      userId: user._id, 
      role: user.role 
    });
    
    res.json({
      message: 'Token refreshed successfully',
      user,
      ...tokens
    });
  } catch (error) {
    res.status(401).json({
      message: 'Invalid refresh token',
      error: error.message
    });
  }
};

export const logout = async (req, res) => {
  // In a production app, you'd want to blacklist the token
  res.json({
    message: 'Logged out successfully'
  });
};

export const getCurrentUser = async (req, res) => {
  try {
    res.json({
      user: req.user
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to get user data',
      error: error.message
    });
  }
};
