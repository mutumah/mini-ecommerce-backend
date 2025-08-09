const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        
        // Enhanced debug logging
        console.log("🔍 Auth Header Details:", {
            exists: !!authHeader,
            value: authHeader ? `${authHeader.substring(0, 15)}...` : 'none',
            type: typeof authHeader
        });

        // Stricter validation
        if (!authHeader || authHeader === 'Bearer null' || authHeader === 'Bearer undefined') {
            return res.status(401).json({ 
                message: 'Invalid or missing token. Please login again.',
                debug: process.env.NODE_ENV === 'development' ? { receivedHeader: authHeader } : undefined
            });
        }

        if (!authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                message: 'Invalid token format. Use: Bearer <token>',
                received: authHeader.substring(0, 15) + '...'
            });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ 
                message: 'No token found after Bearer prefix'
            });
        }

        // Token format validation
        if (token === 'null' || token === 'undefined') {
            return res.status(401).json({ 
                message: 'Invalid token value provided'
            });
        }

        // Decode and verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("🔑 Decoded Token:", decoded);

        // Fetch user with explicit fields
        const user = await User.findById(decoded.id)
            .select('name email isAdmin')
            .lean();

        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        // Set user in request
        req.user = {
            _id: user._id,
            name: user.name,
            email: user.email,
            isAdmin: Boolean(user.isAdmin),
        };

        console.log("✅ Authenticated User:", req.user);
        next();
    } catch (error) {
        console.error("⛔ Auth Error:", {
            name: error.name,
            message: error.message,
            header: req.header('Authorization')
        });
        
        return res.status(401).json({ 
            message: 'Authentication failed. Please login again.',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Invalid token'
        });
    }
};

// Simplified admin middleware
const adminMiddleware = async (req, res, next) => {
    try {
        if (!req.user?.isAdmin) {
            console.log("❌ Admin access denied for user:", req.user?.email);
            return res.status(403).json({ 
                message: "Access denied. Admin only."
            });
        }
        
        console.log("✅ Admin access granted for:", req.user.email);
        next();
    } catch (error) {
        console.error("⚠️ Admin middleware error:", error);
        res.status(500).json({ message: "Error verifying admin status" });
    }
};

module.exports = { protect, adminMiddleware };
