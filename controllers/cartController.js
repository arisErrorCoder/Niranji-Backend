// controllers/cartController.js
const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Add to cart
const addToCart = async (req, res) => {
  try {
    console.log("Incoming request body:", req.body);

    const { userId, productId, selectedSize } = req.body;

    if (!userId || !productId || !selectedSize || !selectedSize.size || !selectedSize.price) {
      console.log("Validation failed: Missing required fields");
      return res.status(400).json({ message: "Missing required fields" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      console.log(`Product not found for ID: ${productId}`);
      return res.status(404).json({ message: "Product not found" });
    }

    console.log("Product found:", product);

    const size = product.pricePerSize.find((s) => s.size === selectedSize.size);
    if (!size) {
      console.log(`Size ${selectedSize.size} not found in product pricePerSize`);
      return res.status(404).json({ message: "Size not found" });
    }

    console.log("Size found:", size);

    let cartItem = await Cart.findOne({ userId, productId, "selectedSize.size": selectedSize.size });

    if (cartItem) {
      console.log("Cart item exists, increasing quantity");
      cartItem.quantity += 1;
    } else {
      console.log("Cart item does not exist, creating a new one");
      cartItem = new Cart({
        userId,
        productId,
        name: product.name,
        image: product.images?.[0] || "", // Ensure an image exists
        selectedSize: {
          size: selectedSize.size,
          price: selectedSize.price, // Now correctly passing a number
        },
        quantity: 1,
      });
    }

    console.log("Saving cart item:", cartItem);
    await cartItem.save();
    
    console.log("Product added to cart successfully");
    res.status(200).json({ message: "Product added to cart", cartItem });
  } catch (error) {
    console.error("Error adding to cart:", error.message);
    res.status(500).json({ message: "Error adding to cart", error: error.message });
  }
};




// Increase quantity
const increaseQuantity = async (req, res) => {
  try {
    const { productId, size } = req.body;

    const cartItem = await Cart.findOne({ productId, 'selectedSize.size': size });
    if (!cartItem) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    cartItem.quantity += 1;
    await cartItem.save();
    res.status(200).json({ message: 'Quantity increased', cartItem });
  } catch (error) {
    res.status(500).json({ message: 'Error increasing quantity', error: error.message });
  }
};

// Decrease quantity
const decreaseQuantity = async (req, res) => {
  try {
    const { productId, size } = req.body;

    const cartItem = await Cart.findOne({ productId, 'selectedSize.size': size });
    if (!cartItem) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    cartItem.quantity = Math.max(cartItem.quantity - 1, 1);
    await cartItem.save();
    res.status(200).json({ message: 'Quantity decreased', cartItem });
  } catch (error) {
    res.status(500).json({ message: 'Error decreasing quantity', error: error.message });
  }
};

// Remove from cart
const removeFromCart = async (req, res) => {
  try {
    const { productId, size } = req.body;

    console.log("Received request to remove from cart:", { productId, size });

    // Find and delete the cart item
    const cartItem = await Cart.findOneAndDelete({ productId, "selectedSize.size": size });

    if (!cartItem) {
      console.log("Cart item not found:", { productId, size });
      return res.status(404).json({ message: "Item not found in cart" });
    }

    console.log("Cart item removed:", cartItem);

    res.status(200).json({ message: "Product removed from cart", cartItem });
  } catch (error) {
    console.error("Error removing from cart:", error);
    res.status(500).json({ message: "Error removing from cart", error: error.message });
  }
};


// Get cart
const getCart = async (req, res) => {
  try {
    const cartItems = await Cart.find();
    res.status(200).json({ cart: cartItems });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching cart', error: error.message });
  }
};

module.exports = {
  addToCart,
  increaseQuantity,
  decreaseQuantity,
  removeFromCart,
  getCart,
};