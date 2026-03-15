import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';

function createLogger() {
  if (isProduction) {
    return pino({ level: process.env.LOG_LEVEL || 'info' });
  }

  // In dev mode, avoid pino-pretty transport (uses worker threads that crash
  // under Next.js webpack). Use plain pino with JSON output instead.
  return pino({ level: process.env.LOG_LEVEL || 'debug' });
}

const logger = createLogger();

export const aiLogger = logger.child({ module: 'ai' });
export const gmailLogger = logger.child({ module: 'gmail' });
export const apiLogger = logger.child({ module: 'api' });
export const authLogger = logger.child({ module: 'auth' });

export default logger;
