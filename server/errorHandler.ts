import type { Request, Response, NextFunction } from 'express';
import { logger } from './logger';

// Custom error class
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Global error handler middleware
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Default error values
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Internal Server Error';
  
  // Log error details
  if (statusCode >= 500) {
    logger.error({
      message: err.message,
      stack: err.stack,
      statusCode,
      path: req.path,
      method: req.method,
      ip: req.ip,
      userId: (req as any).user?.id,
    });
  } else {
    logger.warn({
      message: err.message,
      statusCode,
      path: req.path,
      method: req.method,
    });
  }

  // Don't leak sensitive information in production
  if (process.env.NODE_ENV === 'production') {
    // Only send generic message for 500 errors
    if (statusCode >= 500) {
      message = 'An unexpected error occurred. Please try again later.';
    }
    
    // Send error response without stack trace
    return res.status(statusCode).json({
      message,
      ...(statusCode < 500 && err.errors ? { errors: err.errors } : {})
    });
  }

  // In development, send more detailed error info
  res.status(statusCode).json({
    message,
    stack: err.stack,
    ...(err.errors ? { errors: err.errors } : {})
  });
};

// Async error wrapper - wraps async route handlers to catch errors
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};