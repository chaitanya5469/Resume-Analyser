import { logger } from '../utils/logger.js';

export const errorHandler = (err, req, res, _next) => {
  logger.error('request_failed', {
    method: req.method,
    path: req.path,
    statusCode: err.statusCode || err.status || 500,
    message: err.message,
  });

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File too large. Maximum size is 5MB.' });
  }

  // Prisma errors
  if (err.code === 'P2002') {
    return res.status(409).json({ error: 'Resource already exists.' });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Resource not found.' });
  }

  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal server error',
    ...(err.details && { details: err.details }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
