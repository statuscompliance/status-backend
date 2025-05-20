import mongoose from 'mongoose';
import { format, subDays } from 'date-fns';
import 'dotenv/config';

// Schema for logs (must match the one defined in logger.js)
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
    stack: String,
    functionName: String,
    lineNumber: Number,
    metadata: Object,
  },
  { timestamps: true }
);

// Console log formatting helpers
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

const logInfo = (message) => {
  console.log(`${colors.bright}${colors.blue}[INFO]${colors.reset} ${message}`);
};

const logSuccess = (message) => {
  console.log(`${colors.bright}${colors.green}[SUCCESS]${colors.reset} ${message}`);
};

const logError = (message) => {
  console.error(`${colors.bright}${colors.red}[ERROR]${colors.reset} ${message}`);
};

async function cleanOldLogs() {
  try {
    // Display a header
    console.log('\n' + colors.bright + colors.cyan + '='.repeat(50) + colors.reset);
    console.log(colors.bright + colors.cyan + '          STATUS LOG CLEANER' + colors.reset);
    console.log(colors.bright + colors.cyan + '='.repeat(50) + colors.reset + '\n');
    
    // Connect to the logs database
    logInfo('Connecting to MongoDB logs database...');
    await mongoose.connect(
      process.env.MONGO_LOG_URI || 'mongodb://root:root@localhost:27017/statuslogs?authSource=admin'
    );
    logSuccess('Successfully connected to MongoDB');

    // Register the model
    const LogModel = mongoose.model('Log', logSchema);

    // Calculate the retention date (for example, logs older than 30 days)
    const retentionDays = parseInt(process.env.LOG_RETENTION_DAYS || '30', 10);
    const cutoffDate = subDays(new Date(), retentionDays);
    
    logInfo(`Preparing to delete logs older than: ${colors.yellow}${format(cutoffDate, 'yyyy-MM-dd')}${colors.reset}`);

    // Delete old logs
    const result = await LogModel.deleteMany({
      timestamp: { $lt: cutoffDate }
    });

    if (result.deletedCount > 0) {
      logSuccess(`${colors.bright}${result.deletedCount}${colors.reset} log records were deleted`);
    } else {
      logInfo('No log records found to delete');
    }

    // Close connection
    await mongoose.connection.close();
    logInfo('MongoDB connection closed');
    
    console.log('\n' + colors.bright + colors.cyan + '='.repeat(50) + colors.reset);
    console.log(colors.bright + colors.green + '          CLEANUP COMPLETED SUCCESSFULLY' + colors.reset);
    console.log(colors.bright + colors.cyan + '='.repeat(50) + colors.reset + '\n');

  } catch (error) {
    logError(`Error cleaning logs: ${error.message}`);
    if (error.stack) {
      console.error(colors.dim + error.stack + colors.reset);
    }
    
    // Try to close connection if open
    try {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
        logInfo('MongoDB connection closed');
      }
    } catch {
      // Ignore error on closing
    }
    
    process.exit(1);
  }
}

cleanOldLogs();
