const express = require('express');
const { body, param, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/adminMiddleware');

const router = express.Router();

// Fetch ALL products (for the Products Page)
router.get('/', async (req, res) => {
  try {
    const products = await Product.find({});
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Fetch FEATURED products (for the Home Page)
router.get('/featured', async (req, res) => {
  try {
    const products = await Product.find({}).limit(6);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Middleware for handling validation errors
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// ✅ GET all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find({});
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// ✅ GET single product by ID
router.get(
  '/:id',
  [param('id').custom(value => mongoose.Types.ObjectId.isValid(value)).withMessage('Invalid Product ID')],
  validateRequest,
  async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  }
);

// 🚀 PROTECTED ROUTES (Admin Only)

// ✅ CREATE a new product
router.post(
  '/',
  protect,
  isAdmin,
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a valid number'),
    body('imageUrl').notEmpty().withMessage('Image URL is required'),
    body('category').notEmpty().withMessage('Category is required'),
    body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  ],
  validateRequest,
  async (req, res) => {
    try {
      // Patch: Ensure imageUrl starts with /uploads/
      const newProductData = {
        ...req.body,
        imageUrl: req.body.imageUrl.startsWith('/uploads/')
          ? req.body.imageUrl
          : `/uploads/${req.body.imageUrl}`,
      };

      const newProduct = new Product(newProductData);
      const savedProduct = await newProduct.save();
      res.status(201).json(savedProduct);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

// ✅ UPDATE a product
router.put(
  '/:id',
  protect,
  isAdmin,
  [
    param('id').custom(value => mongoose.Types.ObjectId.isValid(value)).withMessage('Invalid Product ID'),
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('description').optional().notEmpty().withMessage('Description cannot be empty'),
    body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a valid number'),
    body('imageUrl').optional().notEmpty().withMessage('Image URL cannot be empty'),
    body('category').optional().notEmpty().withMessage('Category cannot be empty'),
    body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });

      if (!updatedProduct) {
        return res.status(404).json({ message: 'Product not found' });
      }

      res.json(updatedProduct);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

// ✅ DELETE a product
router.delete(
  '/:id',
  protect,
  isAdmin,
  [param('id').custom(value => mongoose.Types.ObjectId.isValid(value)).withMessage('Invalid Product ID')],
  validateRequest,
  async (req, res) => {
    try {
      const deletedProduct = await Product.findByIdAndDelete(req.params.id);

      if (!deletedProduct) {
        return res.status(404).json({ message: 'Product not found' });
      }

      res.json({ message: 'Product deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

module.exports = router;
