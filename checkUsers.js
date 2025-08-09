require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User'); // Adjust path if needed

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
        console.log("✅ Connected to MongoDB");
        const users = await User.find();
        console.log("Users in DB:", users);
        mongoose.connection.close();
    })
    .catch(err => console.error("❌ Error connecting to DB:", err));
