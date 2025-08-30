import jwt from 'jsonwebtoken';

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'access_secret_key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh_secret_key';

// Log environment variable status
console.log('=== JWT ENVIRONMENT VARIABLES ===');
console.log('JWT_ACCESS_SECRET from env:', !!process.env.JWT_ACCESS_SECRET);
console.log('JWT_REFRESH_SECRET from env:', !!process.env.JWT_REFRESH_SECRET);
console.log('Using fallback secrets:', !process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET);
const ACCESS_TOKEN_EXPIRY = '1h'; // Increased from 15m to 1 hour
const REFRESH_TOKEN_EXPIRY = '7d';

export const generateTokens = (payload) => {
  console.log('=== JWT TOKEN GENERATION ===');
  console.log('Payload:', payload);
  console.log('Access secret present:', !!JWT_ACCESS_SECRET);
  console.log('Refresh secret present:', !!JWT_REFRESH_SECRET);
  console.log('Access expiry:', ACCESS_TOKEN_EXPIRY);
  console.log('Refresh expiry:', REFRESH_TOKEN_EXPIRY);
  
  const accessToken = jwt.sign(payload, JWT_ACCESS_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY
  });
  
  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY
  });
  
  console.log('Tokens generated successfully');
  console.log('Access token length:', accessToken.length);
  console.log('Refresh token length:', refreshToken.length);
  
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
    console.log('=== JWT REFRESH VERIFICATION ===');
    console.log('Token length:', token.length);
    console.log('Token preview:', token.substring(0, 20) + '...');
    console.log('Using secret:', JWT_REFRESH_SECRET ? 'Present' : 'Missing');
    
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET);
    console.log('Token verified successfully:', { userId: decoded.userId, role: decoded.role });
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
