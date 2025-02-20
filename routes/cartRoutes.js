// routes/cartRoutes.js
const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');

// Add to cart
router.post('/add', cartController.addToCart);

// Increase quantity
router.put('/increase', cartController.increaseQuantity);

// Decrease quantity
router.put('/decrease', cartController.decreaseQuantity);

// Remove from cart
router.delete('/remove', cartController.removeFromCart);

// Get cart
router.get('/', cartController.getCart);

module.exports = router;