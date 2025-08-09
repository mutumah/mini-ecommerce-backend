const express = require('express');
const Order = require('../models/Order');
const { protect, adminMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// Get all orders (Admin only)
router.get('/', protect, adminMiddleware, async (req, res) => {
    console.log("🔍 Admin Orders Request:", {
        adminUser: req.user?.email,
        timestamp: new Date().toISOString()
    });

    try {
        const orders = await Order.find()
            .populate('user', 'name email')
            .populate({
                path: 'items.product',
                select: 'name price imageUrl'
            })
            .sort({ createdAt: -1 })
            .lean();

        console.log(`✅ Successfully fetched ${orders.length} orders`);

        res.json({
            success: true,
            count: orders.length,
            orders: orders.map(order => ({
                _id: order._id,
                user: {
                    _id: order.user?._id,
                    name: order.user?.name || 'Deleted User',
                    email: order.user?.email
                },
                items: order.items.map(item => ({
                    product: item.product,
                    quantity: item.quantity,
                    price: item.price
                })),
                totalAmount: Number(order.totalAmount),
                status: order.status,
                createdAt: order.createdAt.toISOString(),
                shippingInfo: order.shippingInfo
            }))
        });

    } catch (error) {
        console.error("❌ Order fetch error:", {
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
        
        res.status(500).json({ 
            success: false,
            message: "Failed to fetch orders",
            error: process.env.NODE_ENV === 'development' ? error.message : "Internal server error"
        });
    }
});

// Create Order (requires login)
router.post('/', protect, async (req, res) => {
  try {
    const { items, totalAmount, shippingInfo } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No items in order.' });
    }

    const newOrder = new Order({
      user: req.user._id,
      items,
      totalAmount,
      shippingInfo
    });

    const savedOrder = await newOrder.save();
    res.status(201).json(savedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get logged in user's orders
router.get('/my-orders', protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ✅ Admin: Mark order as fulfilled
router.patch('/:id/fulfill', protect, adminMiddleware, async (req, res) => {
  try {
    const Product = require('../models/Product');

    // First check if order exists and isn't already delivered
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: "Order not found" 
      });
    }

    if (order.status === 'delivered') {
      return res.status(400).json({
        success: false,
        message: "Order is already marked as delivered"
      });
    }

    // ✅ Subtract stock for each item in the order
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product) {
        // Only subtract if stock is enough (optional safety check)
        if (product.stock >= item.quantity) {
          product.stock -= item.quantity;
          await product.save();
        } else {
          return res.status(400).json({
            success: false,
            message: `Not enough stock to fulfill ${product.name}`
          });
        }
      }
    }

    // Update order status
    const updatedOrder = await Order.findOneAndUpdate(
      { _id: req.params.id },
      { status: 'delivered' },
      { 
        new: true,
        runValidators: true,
        populate: [
          { path: 'user', select: 'name email' },
          { path: 'items.product', select: 'name price imageUrl' }
        ]
      }
    );

    console.log("✅ Order fulfilled & stock updated:", {
      orderId: updatedOrder._id,
      newStatus: updatedOrder.status,
      timestamp: new Date().toISOString()
    });

    res.json({ 
      success: true,
      message: "Order marked as delivered and stock updated",
      order: updatedOrder,
      isDelivered: true
    });
  } catch (error) {
    console.error("❌ Failed to fulfill order:", {
      error: error.message,
      orderId: req.params.id
    });
    
    res.status(500).json({ 
      success: false,
      message: "Failed to fulfill order",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
