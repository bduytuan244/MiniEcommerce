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
  isVerified: { type: Boolean, default: false },
  otp: { type: String }, 
  otpExpire: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);