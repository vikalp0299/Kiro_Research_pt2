const fs = require('fs');
const path = require('path');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  
  // Status code colors
  green: '\x1b[32m',    // 2xx success
  cyan: '\x1b[36m',     // 3xx redirect
  yellow: '\x1b[33m',   // 4xx client error
  red: '\x1b[31m',      // 5xx server error
  blue: '\x1b[34m',     // info
  magenta: '\x1b[35m'   // auth events
};

// Ensure logs directory exists
const logsDir = path.join(__dirname, '..', 'Logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Get color based on HTTP status code
 * @param {number} statusCode - HTTP status code
 * @returns {string} ANSI color code
 */
function getStatusColor(statusCode) {
  if (statusCode >= 500) return colors.red;
  if (statusCode >= 400) return colors.yellow;
  if (statusCode >= 300) return colors.cyan;
  if (statusCode >= 200) return colors.green;
  return colors.reset;
}

/**
 * Format timestamp for display
 * @returns {string} Formatted timestamp
 */
function getTimestamp() {
  return new Date().toISOString();
}

/**
 * Write log entry to file
 * @param {string} filename - Log filename
 * @param {Object} logEntry - Log entry object
 */
function writeLogToFile(filename, logEntry) {
  try {
    const logPath = path.join(logsDir, filename);
    const logLine = JSON.stringify(logEntry) + '\n';
    fs.appendFileSync(logPath, logLine, 'utf8');
  } catch (error) {
    console.error(`${colors.red}Failed to write log to file:${colors.reset}`, error.message);
  }
}

/**
 * Request logging middleware
 * Logs request method, path, IP address, status code, and response time
 */
function logRequest(req, res, next) {
  const startTime = Date.now();
  const timestamp = getTimestamp();
  
  // Get client IP address (handle proxy scenarios)
  const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || 
             req.connection.remoteAddress || 
             req.socket.remoteAddress ||
             'unknown';

  // Capture original res.json and res.send to intercept response
  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);
  
  let responseLogged = false;

  const logResponse = () => {
    if (responseLogged) return;
    responseLogged = true;

    const responseTime = Date.now() - startTime;
    const statusCode = res.statusCode;
    const statusColor = getStatusColor(statusCode);
    
    // Console output with colors
    console.log(
      `${colors.dim}${timestamp}${colors.reset} ` +
      `${colors.bright}${req.method}${colors.reset} ` +
      `${req.path} ` +
      `${statusColor}${statusCode}${colors.reset} ` +
      `${colors.dim}${responseTime}ms${colors.reset} ` +
      `${colors.dim}${ip}${colors.reset}`
    );

    // Structured log entry for file
    const logEntry = {
      timestamp,
      type: 'request',
      method: req.method,
      path: req.path,
      ip,
      statusCode,
      responseTime,
      userAgent: req.headers['user-agent'] || 'unknown',
      userId: req.user?.userId || null
    };

    // Write to daily log file
    const dateStr = new Date().toISOString().split('T')[0];
    writeLogToFile(`requests-${dateStr}.log`, logEntry);
  };

  // Override res.json
  res.json = function(data) {
    logResponse();
    return originalJson(data);
  };

  // Override res.send
  res.send = function(data) {
    logResponse();
    return originalSend(data);
  };

  // Handle cases where response ends without json/send
  res.on('finish', () => {
    logResponse();
  });

  next();
}

/**
 * Log authentication attempts
 * @param {string} identifier - Username or email used for login
 * @param {boolean} success - Whether authentication was successful
 * @param {string} ip - IP address of the request
 * @param {Object} additionalInfo - Additional context (optional)
 */
function logAuthAttempt(identifier, success, ip, additionalInfo = {}) {
  const timestamp = getTimestamp();
  const statusColor = success ? colors.green : colors.red;
  const statusText = success ? 'SUCCESS' : 'FAILED';

  // Console output with colors
  console.log(
    `${colors.dim}${timestamp}${colors.reset} ` +
    `${colors.magenta}AUTH${colors.reset} ` +
    `${statusColor}${statusText}${colors.reset} ` +
    `${colors.bright}${identifier}${colors.reset} ` +
    `${colors.dim}${ip}${colors.reset}`
  );

  // Structured log entry for file
  const logEntry = {
    timestamp,
    type: 'authentication',
    identifier,
    success,
    ip,
    ...additionalInfo
  };

  // Write to daily log file
  const dateStr = new Date().toISOString().split('T')[0];
  writeLogToFile(`auth-${dateStr}.log`, logEntry);
}

/**
 * Log errors with context
 * @param {Error} error - Error object
 * @param {Object} context - Additional context information
 */
function logError(error, context = {}) {
  const timestamp = getTimestamp();

  // Console output with colors
  console.error(
    `${colors.dim}${timestamp}${colors.reset} ` +
    `${colors.red}${colors.bright}ERROR${colors.reset} ` +
    `${error.message}`
  );

  if (context.method && context.path) {
    console.error(
      `${colors.dim}  → ${context.method} ${context.path}${colors.reset}`
    );
  }

  if (context.userId) {
    console.error(
      `${colors.dim}  → User: ${context.userId}${colors.reset}`
    );
  }

  // Structured log entry for file (includes stack trace)
  const logEntry = {
    timestamp,
    type: 'error',
    message: error.message,
    name: error.name,
    stack: error.stack,
    context: {
      method: context.method || null,
      path: context.path || null,
      ip: context.ip || null,
      userId: context.userId || null,
      statusCode: context.statusCode || null,
      ...context
    }
  };

  // Write to daily log file
  const dateStr = new Date().toISOString().split('T')[0];
  writeLogToFile(`errors-${dateStr}.log`, logEntry);
}

module.exports = {
  logRequest,
  logAuthAttempt,
  logError
};
