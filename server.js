const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

//Import Models
const User = require('./models/User');
const Product = require('./models/Products');
const Order = require('./models/Order');

const app = express();

// Kết nối Database
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log(" Đã kết nối thành công với MongoDB!");
  })
  .catch((err) => {
    console.error("Lỗi kết nối:", err.message);
  });

// Chạy server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(` Server đang chạy tại http://localhost:${PORT}`);
});