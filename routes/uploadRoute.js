const express = require('express');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Multer setup
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename(req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

router.post('/', upload.single('image'), (req, res) => {
  res.status(200).json({
    imageUrl: `/uploads/${req.file.filename}`,
    message: 'Image uploaded successfully',
  });
});

module.exports = router;
