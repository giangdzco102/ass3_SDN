const jwt = require('jsonwebtoken');
require('dotenv').config();

// JWT Authentication Middleware
// Client must send header: Authorization: Bearer <token>
const verifyToken = (req, res, next) => {
    // 1. Extract the token from the Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ message: 'Access denied. No token provided' });
    }

    // 2. The header must follow the format: Bearer <token>
    const parts = authHeader.trim().split(/\s+/);
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer' || !parts[1]) {
        return res.status(401).json({ message: 'Invalid token format. Expected: Bearer <token>' });
    }
    const token = parts[1];

    // 3. Verify the token with JWT_SECRET configured in .env
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 4. Valid token: store the decoded payload in req.user and continue
        req.user = decoded; // { studentId, studentCode, email, fullName, iat, exp }
        next();
    } catch (error) {
        // Invalid or expired token: deny access
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token has expired' });
        }
        return res.status(401).json({ message: 'Invalid token' });
    }
};

module.exports = verifyToken;
