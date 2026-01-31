const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

// Import Models
const User = require('./models/User');

const Product = require('./models/Products'); 
const Order = require('./models/Order');

// Import Routes
const productRoutes = require('./routes/productRoutes');

const app = express();

app.use(express.json());

app.use('/api/products', productRoutes);

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