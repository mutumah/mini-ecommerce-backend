require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
const errorHandler = require('./middleware/errorHandler');

const userRoutes = require("./routes/userRoutes");
const productRoutes = require('./routes/productRoutes');
const authRoutes = require("./routes/authRoutes");
const orderRoutes = require('./routes/orderRoutes');
const uploadRoutes = require('./routes/uploadRoute');

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// 🌐 Environment-aware CORS setup
const allowedOrigins = {
  development: ["http://localhost:3000"],
  production: ["https://mini-ecommerce-frontend-tawny.vercel.app"]
};

app.use(cors({
  origin: function (origin, callback) {
    const allowed = allowedOrigins[NODE_ENV];
    if (!origin || allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`❌ CORS blocked for origin: ${origin}`));
    }
  },
  credentials: true,
}));

// Middleware
app.use(express.json());
app.use(helmet());
app.use(morgan("dev"));

// API Routes
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/upload", uploadRoutes);

// Static Uploads Folder with CORS Headers
app.use("/uploads", express.static(path.join(__dirname, "uploads"), {
  setHeaders: (res, filePath) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
}));

// MongoDB Connection
const mongoURI = process.env.MONGO_URI;
if (!mongoURI) {
  console.error("❌ MONGO_URI is missing in .env file!");
  process.exit(1);
}

mongoose.connect(mongoURI)
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch(err => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// Error Handling Middleware
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running in ${NODE_ENV} mode on port ${PORT}`);
});
