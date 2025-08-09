const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        price: {
            type: Number,
            required: true
        }
    }],
    totalAmount: {
        type: Number,
        required: true
    },
    shippingInfo: {
        address: String,
        city: String,
        postalCode: String,
        country: String
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'delivered'], // Note: all lowercase
        default: 'pending',
        required: true
    }
}, { timestamps: true });

// Add a pre-save middleware to validate items
orderSchema.pre('save', function(next) {
    if (!this.items || this.items.length === 0) {
        next(new Error('Order must contain at least one item'));
    }
    next();
});

module.exports = mongoose.model('Order', orderSchema);