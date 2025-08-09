const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// @desc Register new user
// @route POST /api/users/register
const registerUser = async (req, res) => {
    console.log("📌 Register User Route Hit"); // Debugging line
    try {
        const { name, email, password } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        // 🚀 No manual hashing! Mongoose will hash it in User.js
        const newUser = new User({
            name,
            email,
            password, // Directly pass raw password
            isAdmin: false, // 👈 Default to false
        });

        await newUser.save();
        console.log("✅ User saved to DB with hashed password:", newUser.password);
        console.log("🔍 DEBUG: Full user object saved to DB:", newUser);

        // ✅ Generate JWT Token with `isAdmin` included
        const token = jwt.sign(
            { id: newUser._id, isAdmin: newUser.isAdmin },  // 👈 Include `isAdmin`
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.status(201).json({
            message: "User registered successfully",
            token,
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                isAdmin: newUser.isAdmin, // 👈 Ensure frontend gets `isAdmin`
            },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Login user
// @route POST /api/users/login
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log("📝 LOGIN: Received login attempt for email:", email);

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            console.log("⚠️ LOGIN: No user found with email:", email);
            return res.status(400).json({ message: "Invalid credentials" });
        }

        console.log("✅ LOGIN: User found with email:", email);
        console.log("💾 LOGIN: Stored password hash in DB:", user.password);

        // Check password
        if (!password) {
            console.log("⚠️ LOGIN: Empty password provided");
            return res.status(400).json({ message: "Password required" });
        }

        console.log("🔍 LOGIN: About to compare password");

        try {
            // Check password - don't convert to String if it affects comparison
            const isMatch = await bcrypt.compare(password, user.password);
            console.log("🧪 LOGIN: bcrypt.compare result:", isMatch);

            if (!isMatch) {
                console.log("⚠️ LOGIN: Password comparison failed");
                return res.status(400).json({ message: "Invalid credentials" });
            }
        } catch (bcryptError) {
            console.error("🔥 LOGIN: bcrypt.compare error:", bcryptError);
            return res.status(500).json({ message: "Error verifying credentials" });
        }

        console.log("✅ LOGIN: Password verified successfully");

        // ✅ Generate JWT Token with `isAdmin` included
        const token = jwt.sign(
            { id: user._id, isAdmin: user.isAdmin },  // 👈 Include `isAdmin`
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                isAdmin: user.isAdmin, // 👈 Ensure frontend gets `isAdmin`
            },
        });
    } catch (error) {
        console.error("🔥 LOGIN ERROR:", error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = { registerUser, loginUser };
