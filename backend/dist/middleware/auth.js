import { verifyToken } from '../utils/jwt.js';
export const authenticate = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1]; // Bearer <token>
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }
        const decoded = verifyToken(token);
        req.user = decoded;
        next();
    }
    catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};
// Middleware to check if user is admin
export const isAdmin = (req, res, next) => {
    if (req.user?.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};
