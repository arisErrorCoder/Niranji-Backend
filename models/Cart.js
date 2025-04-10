const mongoose = require("mongoose");

const CartSchema = new mongoose.Schema({
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'niranjiUser', // Assuming you have a User model
      required: true,
    },
  productId: mongoose.Schema.Types.ObjectId,
  name: String,
  image: String,
  selectedSize: {
    size: String,
    price: Number,
  },
  quantity: Number,
});

module.exports = mongoose.model("NiranjiCart", CartSchema);
