import { verifyAccessToken, extractTokenFromHeader } from '../utils/jwt.js';
import { User } from '../models/index.js';

export const authenticateToken = async (req, res, next) => {
  try {
    console.log('=== AUTH MIDDLEWARE ===');
    console.log('Path:', req.path);
    console.log('Method:', req.method);
    console.log('Authorization header:', req.headers.authorization ? 'Present' : 'Missing');
    
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      console.log('No token provided');
      return res.status(401).json({ message: 'Access token required' });
    }
    
    console.log('Token extracted, length:', token.length);
    
    const decoded = verifyAccessToken(token);
    console.log('Token decoded successfully, userId:', decoded.userId);
    
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user || user.status !== 'active') {
      console.log('User not found or inactive:', { found: !!user, status: user?.status });
      return res.status(401).json({ message: 'User not found or inactive' });
    }
    
    console.log('User authenticated:', { id: user._id, role: user.role, username: user.username });
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (token) {
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.status === 'active') {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication for optional auth
    next();
  }
};
