const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'niranjiUser',
      required: true
    },
    paymentId: {
      type: String,
      required: true,
    },
    shipping: {
      name: String,
      email: String,
      phone: String,
      address: String,
      city: String,
      state: String,
      zip: String,
      country: String,
    },
    billing: {
      name: String,
      email: String,
      phone: String,
      address: String,
      city: String,
      state: String,
      zip: String,
      country: String,
    },
    cart: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'NiranjiProduct'
        },
        name: String,
        quantity: Number,
        price: Number,
      },
    ],
    total: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Paid", "Shipped", "Delivered", "Cancelled"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("nirajiOrder", OrderSchema);
