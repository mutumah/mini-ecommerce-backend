const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/User');
require("dotenv").config();

// Validation middleware
const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// GET /api/auth/me - Get current user profile
router.get('/me', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/auth/login - Login user
router.post('/login',
    [
        body('email').isEmail().withMessage('Please enter a valid email'),
        body('password').exists().withMessage('Password is required')
    ],
    validateRequest,
    async (req, res) => {
        try {
            const { email, password } = req.body;
            const user = await User.findOne({ email });
            
            if (!user || !(await user.matchPassword(password))) {
                return res.status(401).json({ message: 'Invalid email or password' });
            }

            res.json({
                token: user.generateAuthToken(),
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    isAdmin: user.isAdmin
                }
            });
        } catch (error) {
            res.status(500).json({ message: 'Server error' });
        }
    }
);

// POST /api/auth/register - Register new user
router.post(
    "/register",
    [
        body("name").notEmpty().withMessage("Name is required"),
        body("email").isEmail().withMessage("Valid email is required"),
        body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    ],
    validateRequest,
    async (req, res) => {
        const { name, email, password } = req.body;

        try {
            let user = await User.findOne({ email });
            if (user) return res.status(400).json({ message: "User already exists" });

            user = new User({ name, email, password });
            await user.save();

            res.status(201).json({ message: "User registered successfully" });
        } catch (error) {
            console.error("Registration Error:", error.message);
            res.status(500).json({ message: "Internal server error" });
        }
    }
);

module.exports = router;
