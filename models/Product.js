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
  howtouse: [String],
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
// Add this to your Product model
productSchema.statics.updateProductRating = async function(productId) {
  const stats = await this.model('Review').aggregate([
    { $match: { product: productId } },
    {
      $group: {
        _id: '$product',
        averageRating: { $avg: '$rating' },
        reviewCount: { $sum: 1 }
      }
    }
  ]);

  if (stats.length > 0) {
    await this.findByIdAndUpdate(productId, {
      rating: parseFloat(stats[0].averageRating.toFixed(1)),
      reviews: stats[0].reviewCount
    });
  } else {
    await this.findByIdAndUpdate(productId, {
      rating: 0,
      reviews: 0
    });
  }
};
const Product = mongoose.model("NiranjiProduct", productSchema);

module.exports = Product;
