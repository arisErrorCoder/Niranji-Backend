const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');
const cartRoutes = require('./routes/cartRoutes');
const paymentController = require("./controllers/paymentController");
const dotenv = require('dotenv');
dotenv.config();


const app = express();
app.use(express.json());
app.use(cors());
app.use("/uploads", express.static("uploads")); // Serve uploaded images
app.use("/api/images", express.static('uploads'));


app.use("/api/products", productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes);
app.post("/api/payment", paymentController.createOrder);
app.post("/api/payment/verify", paymentController.verifyPayment);

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, })
  .then(() => app.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`)))
  .catch((err) => console.log(err));
