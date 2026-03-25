require('dotenv').config(); 

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const { errorHandler } = require('./middleware/errorMiddleware');

require('./models/User');
require('./models/Products');
require('./models/Order');
require('./models/Review');
require('./models/Coupon');

const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const couponRoutes = require('./routes/couponRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();

app.use(cors()); 
app.use(express.json()); 

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
  res.send('MiniEcommerce API Server is running mượt mà...');
});

app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/upload', uploadRoutes);

app.use(errorHandler);

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Kết nối MongoDB thành công');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server Backend chạy tại http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Lỗi kết nối MongoDB:', err.message);
  });