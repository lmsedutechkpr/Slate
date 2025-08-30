import jwt from 'jsonwebtoken';

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'access_secret_key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh_secret_key';

// Check if environment variables are set, otherwise use fallback secrets
const ACCESS_TOKEN_EXPIRY = '1h'; // Increased from 15m to 1 hour
const REFRESH_TOKEN_EXPIRY = '7d';

export const generateTokens = (payload) => {
  
  const accessToken = jwt.sign(payload, JWT_ACCESS_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY
  });
  
    const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY
  });
  
  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, JWT_ACCESS_SECRET);
  } catch (error) {
    throw new Error('Invalid access token');
  }
};

export const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET);
    return decoded;
  } catch (error) {
    console.error('JWT verification failed:', error.message);
    console.error('Error type:', error.name);
    if (error.name === 'TokenExpiredError') {
      console.error('Token expired at:', error.expiredAt);
    }
    throw new Error(`Invalid refresh token: ${error.message}`);
  }
};

export const extractTokenFromHeader = (authHeader) => {
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
};
