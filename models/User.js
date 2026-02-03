const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true }, // uniqe email
  password: { type: String, required: true }, // Mã hóa password
  phone: { type: String },
  address: { type: String },
  isAdmin: { type: Boolean, default: false }, 
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  refreshToken: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);