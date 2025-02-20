const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');
const cartRoutes = require('./routes/cartRoutes');

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
app.use("/uploads", express.static("uploads")); // Serve uploaded images
app.use("/api/images", express.static('uploads'));


app.use("/api/products", productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes);

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => app.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`)))
  .catch((err) => console.log(err));
