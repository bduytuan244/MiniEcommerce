const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();


const User = require('./models/User');

const Product = require('./models/Products'); 
const Order = require('./models/Order');

// CRUD Routes
const productRoutes = require('./routes/productRoutes');

// Order Routes
const orderRoutes = require('./routes/orderRoutes');

// Auth Routes
const authRoutes = require('./routes/authRoutes');

// User Routes
const userRoutes = require('./routes/userRoutes');

// Cagetory
const categoryRoutes = require('./routes/categoryRoutes');

// Dashboard
const dashboardRoutes = require('./routes/dashboardRoutes');

// Review
const reviewRoutes = require('./routes/reviewRoutes');

// Coupon
const couponRoutes = require('./routes/couponRoutes');

const app = express();

app.use(express.json());

app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/coupons', couponRoutes);
app.use(errorHandler);
// Kết nối Database
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Đã kết nối thành công với MongoDB!");
  })
  .catch((err) => {
    console.error("Lỗi kết nối:", err.message);
  });

  
// Chạy server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});