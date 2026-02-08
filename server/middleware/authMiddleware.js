const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_MVP';

const protect = (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, JWT_SECRET);

            req.user = decoded; // { id, role }
            next();
        } catch (error) {
            console.error('Auth Middleware Error:', error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        console.log(`[Auth Check] User ID: ${req.user?.id}`);
        console.log(`[Auth Check] User Role: ${req.user?.role}`);
        console.log(`[Auth Check] Required Roles: ${roles.join(', ')}`);

        if (!roles.includes(req.user.role)) {
            console.log('[Auth Check] FAILED: Role mismatch');
            return res.status(403).json({
                message: `User role '${req.user.role}' not authorized. Required: ${roles.join(', ')}`
            });
        }
        next();
    };
};

module.exports = { protect, authorize };
