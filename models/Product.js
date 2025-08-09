const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: [true, "Product name is required"], trim: true },
    description: { type: String, required: [true, "Product description is required"], trim: true },
    price: { type: Number, required: [true, "Price is required"], min: [0, "Price cannot be negative"] },
    imageUrl: { type: String, required: [true, "Image URL is required"] },
    category: { type: String, required: [true, "Category is required"] },
    stock: { type: Number, required: [true, "Stock is required"], min: [0, "Stock cannot be negative"] }
}, { timestamps: true });

const Product = mongoose.model("Product", productSchema);
module.exports = Product;
