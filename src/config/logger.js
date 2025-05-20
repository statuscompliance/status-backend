import winston from 'winston';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import os from 'os';

const isTestEnvironment = !!import.meta.env?.VITEST;

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
  },
  colors: {
    error: 'bold red',
    warn: 'bold yellow',
    info: 'bold green',
    http: 'bold cyan',
    debug: 'bold magenta',
  },
};

// Add colors to winston
winston.addColors(customLevels.colors);

// Custom formatter for console logs
const consoleFormat = winston.format.printf(({ level, message, timestamp, ...metadata }) => {
  // Extract main properties for display
  const requestId = metadata.requestId || '-';
  const userId = metadata.userId || '-';
  const method = metadata.method || '';
  const url = metadata.url || '';
  const statusCode = metadata.statusCode || '';
  
  // Format the timestamp
  const formattedDate = new Date(timestamp).toISOString();
  
  // Format requestId and userId brackets
  // If both are empty or just dashes, show a single bracket pair
  let idSection = '';
  if (requestId === '-' && userId === '-') {
    idSection = '[-]';
  } else if (requestId === '-') {
    idSection = `[-] [${userId}]`;
  } else if (userId === '-') {
    idSection = `[${requestId}] [-]`;
  } else {
    idSection = `[${requestId}] [${userId}]`;
  }
  
  // Determine HTTP request log format
  if (method && url) {
    let httpInfo = `${method.padEnd(7)} ${url}`;
    if (statusCode) {
      const statusColor = statusCode >= 400 ? '\x1b[31m' : '\x1b[32m'; // red or green
      httpInfo += ` ${statusColor}${statusCode}\x1b[0m`;
    }
    return `${formattedDate} [${level.padEnd(5)}] ${idSection} ${httpInfo}`;
  }
  
  // Format for error logs with stack trace
  if (metadata.stack) {
    return `${formattedDate} [${level.padEnd(5)}] ${idSection} ${message}\n${metadata.stack}`;
  }
  
  // Check for connection info or other special metadata display
  if (metadata.uri || metadata.database || metadata.host) {
    let infoStr = message;
    
    // Add relevant connection details inline instead of JSON format
    const details = [];
    if (metadata.uri && metadata.uri !== '[REDACTED]') details.push(`uri: ${metadata.uri}`);
    if (metadata.database) details.push(`db: ${metadata.database}`);
    if (metadata.host) details.push(`host: ${metadata.host}`);
    
    if (details.length > 0) {
      infoStr += ` (${details.join(', ')})`;
    }
    
    return `${formattedDate} [${level.padEnd(5)}] ${idSection} ${infoStr}`;
  }
  
  // Clean metadata for display (remove common fields)
  const cleanedMeta = { ...metadata };
  delete cleanedMeta.service;
  delete cleanedMeta.environment;
  delete cleanedMeta.host;
  delete cleanedMeta.pid;
  delete cleanedMeta.requestId;
  delete cleanedMeta.userId;
  delete cleanedMeta.ip;
  delete cleanedMeta.url;
  delete cleanedMeta.method;
  delete cleanedMeta.stack;
  delete cleanedMeta.functionName;
  delete cleanedMeta.lineNumber;
  delete cleanedMeta.uri;
  delete cleanedMeta.database;
  
  // Basic format for other logs
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
    // Only add MongoDB transport if not in test environment
    ...(isTestEnvironment ? [] : [
      new MongoTransport({
        level: 'info',
      })
    ]),
  ],
  exitOnError: false,
});

// Function to initialize MongoDB connection for logs
export const initLogDB = async () => {
  // Skip MongoDB connection in test environment
  if (isTestEnvironment) {
    logger.info('Test environment detected - skipping MongoDB logger initialization');
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
