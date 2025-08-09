const express = require("express");
const { registerUser, loginUser } = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");
const User = require("../models/User");

const router = express.Router();

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
router.post("/register", registerUser);

// @desc    Login user & get token
// @route   POST /api/users/login
// @access  Public
router.post("/login", loginUser);

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private (Requires token)
router.get("/profile", protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({
            id: user._id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt,
        });
    } catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

module.exports = router;
