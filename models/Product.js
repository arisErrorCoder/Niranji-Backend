const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  type: String,
  image: String,
  subtitle: String,
  tags: [String],
  rating: Number,
  reviews: Number,
  nutrients: [String],
  description: [String],
  pricePerSize: [
    {
      size: String,
      price: {
        original: Number,
        discounted: Number,
        discountPercentage: Number,
      },
    },
  ],
  images: [String],
  benefits: [String],
  storageInfo: {
    storage: String,
    netQuantity: String,
    expiry: String,
  },
});

const Product = mongoose.model("NiranjiProduct", productSchema);

module.exports = Product;
