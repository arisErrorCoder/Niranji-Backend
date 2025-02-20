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
  deliveryInfo: {
    locations: [{ region: String, time: String }],
    freeShippingThreshold: Number,
    codCharges: Number,
  },
  nutrients: [String],
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
