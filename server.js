const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const { errorHandler } = require('./middleware/errorMiddleware');
require('dotenv').config();

// Import Models (để mongoose register schema)
require('./models/User');
require('./models/Products');
require('./models/Order');

// Import Routes
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const couponRoutes = require('./routes/couponRoutes');

const app = express();

/* =========================
   MIDDLEWARE
========================= */
app.use(express.json());

/* Serve Frontend (Views) */
app.use(express.static(path.join(__dirname, 'views')));

/* =========================
   ROUTES
========================= */
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/coupons', couponRoutes);

/* =========================
   ERROR HANDLER
========================= */
app.use(errorHandler);

/* =========================
   DATABASE
========================= */
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Kết nối MongoDB thành công');
  })
  .catch((err) => {
    console.error('Lỗi kết nối MongoDB:', err.message);
  });

/* =========================
   SERVER
========================= */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server chạy tại http://localhost:${PORT}`);
});
