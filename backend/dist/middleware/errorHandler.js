import * as Sentry from '@sentry/node';
export class AppError extends Error {
    statusCode;
    isOperational;
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
export const errorHandler = (err, req, res, next) => {
    // Log to Sentry (only for non-operational errors in production)
    if (!(err instanceof AppError) && process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
        Sentry.captureException(err, {
            tags: {
                path: req.path,
                method: req.method,
            },
            user: {
                ip: req.ip,
            },
        });
    }
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            success: false,
            error: err.message,
        });
    }
    // Prisma errors
    if (err.name === 'PrismaClientKnownRequestError') {
        const prismaError = err;
        if (prismaError.code === 'P2002') {
            return res.status(400).json({
                success: false,
                error: 'A record with this value already exists',
            });
        }
        if (prismaError.code === 'P2025') {
            return res.status(404).json({
                success: false,
                error: 'Record not found',
            });
        }
    }
    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            error: 'Invalid token',
        });
    }
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            error: 'Token expired',
        });
    }
    // Default error
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    });
};
