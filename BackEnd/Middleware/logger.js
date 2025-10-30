const fs = require('fs');
const path = require('path');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Ensure Logs directory exists
const logsDir = path.join(__dirname, '..', 'Logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Get color based on HTTP status code
 * @param {number} statusCode - HTTP status code
 * @returns {string} ANSI color code
 */
const getStatusColor = (statusCode) => {
  if (statusCode >= 200 && statusCode < 300) return colors.green;
  if (statusCode >= 300 && statusCode < 400) return colors.cyan;
  if (statusCode >= 400 && statusCode < 500) return colors.yellow;
  if (statusCode >= 500) return colors.red;
  return colors.white;
};

/**
 * Get color based on HTTP method
 * @param {string} method - HTTP method
 * @returns {string} ANSI color code
 */
const getMethodColor = (method) => {
  switch (method) {
    case 'GET': return colors.green;
    case 'POST': return colors.yellow;
    case 'PUT': return colors.blue;
    case 'DELETE': return colors.red;
    case 'PATCH': return colors.magenta;
    default: return colors.white;
  }
};

/**
 * Format log entry for file
 * @param {Object} logData - Log data object
 * @returns {string} Formatted log entry
 */
const formatLogEntry = (logData) => {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] ${logData.method} ${logData.url} - ${logData.statusCode} - ${logData.responseTime}ms - ${logData.userAgent || 'Unknown'}\n`;
};

/**
 * Write log to file
 * @param {Object} logData - Log data object
 */
const writeLogToFile = (logData) => {
  const logFile = path.join(logsDir, `access-${new Date().toISOString().split('T')[0]}.log`);
  const logEntry = formatLogEntry(logData);
  
  fs.appendFile(logFile, logEntry, (err) => {
    if (err) {
      console.error('Error writing to log file:', err);
    }
  });
};

/**
 * Request logger middleware with color-coded output
 */
const logger = (req, res, next) => {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  
  // Override res.end to capture response details
  const originalEnd = res.end;
  res.end = function(...args) {
    const responseTime = Date.now() - startTime;
    const statusCode = res.statusCode;
    const method = req.method;
    const url = req.originalUrl || req.url;
    const userAgent = req.get('User-Agent');
    
    // Color-coded console output
    const methodColor = getMethodColor(method);
    const statusColor = getStatusColor(statusCode);
    
    console.log(
      `${colors.dim}[${timestamp}]${colors.reset} ` +
      `${methodColor}${method}${colors.reset} ` +
      `${colors.cyan}${url}${colors.reset} - ` +
      `${statusColor}${statusCode}${colors.reset} - ` +
      `${colors.yellow}${responseTime}ms${colors.reset}`
    );
    
    // Log to file
    const logData = {
      method,
      url,
      statusCode,
      responseTime,
      userAgent
    };
    writeLogToFile(logData);
    
    // Call original end method
    originalEnd.apply(this, args);
  };
  
  next();
};

module.exports = logger;