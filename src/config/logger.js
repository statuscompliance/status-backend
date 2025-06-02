import winston from 'winston';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import os from 'os';

const isTestEnvironment = !!import.meta.env?.VITEST;
/* istanbul ignore next */
const isMongoLoggingEnabled = process.env.MONGO_LOGGING_ENABLED !== 'false';

// Schema for logs in MongoDB
const logSchema = new mongoose.Schema(
  {
    timestamp: Date,
    level: String,
    message: String,
    service: String,
    environment: String,
    host: String,
    pid: Number,
    requestId: String,
    userId: String,
    ip: String,
    url: String,
    method: String,
    statusCode: Number,
    stack: String,
    functionName: String,
    lineNumber: Number,
    metadata: Object,
  },
  { timestamps: true }
);

// Model for logs
let LogModel;
try {
  LogModel = mongoose.model('Log');
} catch {
  LogModel = mongoose.model('Log', logSchema);
}

// Custom log levels with colors
const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
    database: 5,
  },
  colors: {
    error: 'bold red',
    warn: 'bold yellow',
    info: 'bold green',
    http: 'bold cyan',
    debug: 'bold magenta',
    database: 'bold blue',
  },
};

// Add colors to winston
winston.addColors(customLevels.colors);

// Format timestamp to ISO
const formatTimestamp = (timestamp) => new Date(timestamp).toISOString();

// Format ID section
const formatIdSection = (requestId, userId) => {
  if (requestId === '-' && userId === '-') return '[-]';
  if (requestId === '-') return `[-] [${userId}]`;
  if (userId === '-') return `[${requestId}] [-]`;
  return `[${requestId}] [${userId}]`;
};

// Format HTTP log
const formatHttpLog = (timestamp, level, idSection, method, url, statusCode) => {
  let httpInfo = `${method.padEnd(7)} ${url}`;
  if (statusCode) {
    const statusColor = statusCode >= 400 ? '\x1b[31m' : '\x1b[32m';
    httpInfo += ` ${statusColor}${statusCode}\x1b[0m`;
  }
  return `${timestamp} [${level.padEnd(5)}] ${idSection} ${httpInfo}`;
};

// Format error log
const formatErrorLog = (timestamp, level, idSection, message, stack) => {
  return `${timestamp} [${level.padEnd(5)}] ${idSection} ${message}\n${stack}`;
};

// Format connection log
const formatConnectionLog = (timestamp, level, idSection, message, metadata) => {
  const details = [];
  if (metadata.uri && metadata.uri !== '[REDACTED]') details.push(`uri: ${metadata.uri}`);
  if (metadata.database) details.push(`db: ${metadata.database}`);
  if (metadata.host) details.push(`host: ${metadata.host}`);
  
  const infoStr = details.length > 0 ? `${message} (${details.join(', ')})` : message;
  return `${timestamp} [${level.padEnd(5)}] ${idSection} ${infoStr}`;
};

// Clean metadata by removing common fields
const cleanMetadata = (metadata) => {
  const fieldsToRemove = [
    'service', 'environment', 'host', 'pid', 'requestId', 'userId', 
    'ip', 'url', 'method', 'stack', 'functionName', 'lineNumber', 
    'uri', 'database'
  ];
  
  const cleanedMeta = { ...metadata };
  fieldsToRemove.forEach(field => delete cleanedMeta[field]);
  return cleanedMeta;
};

// Main console format
const consoleFormat = winston.format.printf(({ level, message, timestamp, ...metadata }) => {
  // Extract main properties 
  const requestId = metadata.requestId || '-';
  const userId = metadata.userId || '-';
  const method = metadata.method || '';
  const url = metadata.url || '';
  const statusCode = metadata.statusCode || '';
  
  // Format timestamp and IDs
  const formattedDate = formatTimestamp(timestamp);
  const idSection = formatIdSection(requestId, userId);
  
  // HTTP request logs
  if (method && url) {
    return formatHttpLog(formattedDate, level, idSection, method, url, statusCode);
  }
  
  // Error logs with stack trace
  if (metadata.stack) {
    return formatErrorLog(formattedDate, level, idSection, message, metadata.stack);
  }
  
  // Connection logs
  if (metadata.uri || metadata.database || metadata.host) {
    return formatConnectionLog(formattedDate, level, idSection, message, metadata);
  }
  
  // Basic format for other logs
  const cleanedMeta = cleanMetadata(metadata);
  const metaString = Object.keys(cleanedMeta).length > 0 
    ? `\n${JSON.stringify(cleanedMeta, null, 2)}` 
    : '';
    
  return `${formattedDate} [${level.padEnd(5)}] ${idSection} ${message}${metaString}`;
});

// Custom MongoDB transport
class MongoTransport extends winston.Transport {
  constructor(opts) {
    super(opts);
    this.name = 'mongodb';
    this.level = opts.level || 'info';
  }

  async log(info, callback) {
    try {
      await LogModel.create({
        timestamp: new Date(),
        level: info.level,
        message: info.message,
        service: info.service || 'status-backend',
        environment: process.env.NODE_ENV || 'development',
        host: info.host || os.hostname(),
        pid: info.pid || process.pid,
        requestId: info.requestId || 'no-request-id',
        userId: info.userId || 'anonymous',
        ip: info.ip || '',
        url: info.url || '',
        method: info.method || '',
        statusCode: info.statusCode || null,
        stack: info.stack || '',
        functionName: info.functionName || '',
        lineNumber: info.lineNumber || 0,
        metadata: info.metadata || {},
      });
    } catch (error) {
      console.error('Error saving log to MongoDB:', error);
    }

    if (callback) {
      callback();
    }
  }
}

// Create logger instance
const logger = winston.createLogger({
  levels: customLevels.levels,
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'status-backend',
    environment: process.env.NODE_ENV || 'development',
    host: os.hostname(),
    pid: process.pid,
  },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.colorize({ all: true }),
        consoleFormat
      ),
    }),
    // Only add MongoDB transport if not in test environment and MongoDB logging is enabled
    ...(isTestEnvironment || !isMongoLoggingEnabled ? [] : [
      new MongoTransport({
        level: 'info',
      })
    ]),
  ],
  exitOnError: false,
});

// Function to initialize MongoDB connection for logs
export const initLogDB = async () => {
  // Skip MongoDB connection in test environment or if MongoDB logging is disabled
  if (isTestEnvironment || !isMongoLoggingEnabled) {
    const skipReason = isTestEnvironment ? 'Test environment detected' : 'MongoDB logging disabled';
    logger.info(`${skipReason} - skipping MongoDB logger initialization`);
    return null;
  }
  
  // Use a separate connection for logs
  const logConnection = mongoose.createConnection(
    process.env.MONGO_LOG_URI || 'mongodb://root:root@localhost:27017/statuslogs?authSource=admin'
  );
  
  // Register the model on this specific connection
  LogModel = logConnection.model('Log', logSchema);
  
  logger.info('Logger MongoDB connection initialized');
  return logConnection;
};

// Middleware to log HTTP request details
export const requestLogger = (req, res, next) => {
  // Generate a unique ID for the request
  const requestId = uuidv4();
  req.requestId = requestId;

  // Capture the start time of the request
  const start = Date.now();

  // Event when response finishes
  res.on('finish', () => {
    const duration = Date.now() - start;
    const userId = req.user?.id || 'anonymous';
    
    // Determine log level based on status code
    const level = res.statusCode >= 400 ? 'warn' : 'http';
    
    logger[level](`${req.method} ${req.originalUrl}`, {
      requestId,
      userId,
      ip: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      url: req.originalUrl,
      method: req.method,
      statusCode: res.statusCode,
      duration,
      userAgent: req.headers['user-agent'],
    });
  });

  next();
};

// Function to log errors with stack trace
export const logError = (error, requestInfo = {}) => {
  const errorInfo = {
    ...requestInfo,
    stack: error.stack,
    message: error.message,
  };
  
  logger.error(`Error: ${error.message}`, errorInfo);
};

export default logger;
