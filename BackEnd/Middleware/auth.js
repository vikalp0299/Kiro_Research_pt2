const jwt = require('jsonwebtoken');

// In-memory token blacklist (use DynamoDB or Redis in production for distributed systems)
const tokenBlacklist = new Set();

/**
 * Generate access and refresh tokens for a user
 * @param {Object} payload - Token payload containing userId, username, email
 * @returns {Object} Object containing accessToken and refreshToken
 */
function generateTokens(payload) {
  const { userId, username, email } = payload;

  // Validate required payload fields
  if (!userId || !username || !email) {
    throw new Error('Missing required token payload fields: userId, username, email');
  }

  const JWT_SECRET = process.env.JWT_SECRET;
  const JWT_ISSUER = process.env.JWT_ISSUER || 'class-registration-app';
  const JWT_AUDIENCE = process.env.JWT_AUDIENCE || 'class-registration-users';
  const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30m';
  const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  // Generate access token
  const accessToken = jwt.sign(
    {
      userId,
      username,
      email,
      type: 'access'
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE
    }
  );

  // Generate refresh token
  const refreshToken = jwt.sign(
    {
      userId,
      username,
      email,
      type: 'refresh'
    },
    JWT_SECRET,
    {
      expiresIn: JWT_REFRESH_EXPIRES_IN,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE
    }
  );

  return {
    accessToken,
    refreshToken
  };
}

/**
 * Add a token to the blacklist
 * @param {string} token - JWT token to blacklist
 */
function blacklistToken(token) {
  if (!token) {
    throw new Error('Token is required for blacklisting');
  }
  tokenBlacklist.add(token);
}

/**
 * Check if a token is blacklisted
 * @param {string} token - JWT token to check
 * @returns {boolean} True if token is blacklisted, false otherwise
 */
function isTokenBlacklisted(token) {
  if (!token) {
    return false;
  }
  return tokenBlacklist.has(token);
}

/**
 * Verify JWT token middleware
 * Extracts token from Authorization header, verifies it, and attaches user info to req.user
 */
function verifyToken(req, res, next) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if header follows "Bearer <token>" format
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({ error: 'Invalid authorization header format' });
    }

    const token = parts[1];

    // Check if token is blacklisted
    if (isTokenBlacklisted(token)) {
      return res.status(401).json({ error: 'Token has been revoked' });
    }

    const JWT_SECRET = process.env.JWT_SECRET;
    const JWT_ISSUER = process.env.JWT_ISSUER || 'class-registration-app';
    const JWT_AUDIENCE = process.env.JWT_AUDIENCE || 'class-registration-users';

    if (!JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is not set');
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE
    });

    // Attach user info to request object
    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      email: decoded.email,
      type: decoded.type
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token has expired' });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    } else if (error.name === 'NotBeforeError') {
      return res.status(401).json({ error: 'Token not yet valid' });
    } else {
      return res.status(500).json({ error: 'Authentication error' });
    }
  }
}

/**
 * Clear the token blacklist (useful for testing)
 */
function clearBlacklist() {
  tokenBlacklist.clear();
}

module.exports = {
  generateTokens,
  blacklistToken,
  isTokenBlacklisted,
  verifyToken,
  clearBlacklist
};
