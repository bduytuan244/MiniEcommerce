const crypto = require('crypto');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');
// Create token
const generateTokens = (id) => {
  const accessToken = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });

  const refreshToken = jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE,
  });

  return { accessToken, refreshToken };
};

// Register
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "Email này đã được sử dụng" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpire = Date.now() + 10 * 60 * 1000; 

    const user = await User.create({
      name,
      email,
      password,
      otp,
      otpExpire,
      isVerified: false 
    });

    const message = `Mã xác thực của bạn là: ${otp}\nMã này có hiệu lực trong 10 phút.`;
    try {
      await sendEmail({
        email: user.email,
        subject: 'Mã OTP Xác thực tài khoản',
        message
      });
      
      res.status(200).json({ 
        message: "Đăng ký thành công! Vui lòng kiểm tra email để lấy mã OTP kích hoạt tài khoản.",
        email: user.email 
      });

    } catch (error) {
      console.error("CHI TIẾT LỖI GỬI MAIL:", error);
      await User.findByIdAndDelete(user._id);
      return res.status(500).json({ message: "Không thể gửi email OTP. Vui lòng thử lại." });
    }

  } catch (error) {
    next(error);
  }
};

// Login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Vui lòng nhập email và mật khẩu" });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Thông tin đăng nhập không đúng" });
    }

    if (!user.isVerified) {
       return res.status(401).json({ message: "Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email lấy OTP." });
    }

    const tokens = generateTokens(user._id);

    user.refreshToken = tokens.refreshToken;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    next(error);
  }
};

// Refresh token
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: "Bạn chưa đăng nhập (Thiếu Refresh Token)" });
    }

    const user = await User.findOne({ refreshToken });
    if (!user) {
      return res.status(403).json({ message: "Token không hợp lệ hoặc đã đăng xuất" });
    }

    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: "Token đã hết hạn, vui lòng đăng nhập lại" });
      }

      const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE,
      });

      res.json({ accessToken }); 
    });

  } catch (error) {
    next(error);
  }
};

// Forgot pass
exports.forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy email này" });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');

    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    await user.save({ validateBeforeSave: false });

    const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;

    const message = `Bạn vừa yêu cầu đặt lại mật khẩu. Hãy bấm vào link dưới đây:\n\n${resetUrl}`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Khôi phục mật khẩu - Mini Ecommerce',
        message
      });

      res.status(200).json({ message: "Đã gửi email hướng dẫn đặt lại mật khẩu!" });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({ message: "Không thể gửi email" });
    }

  } catch (error) {
    next(error); 
  }
};

// Set new pass
exports.resetPassword = async (req, res, next) => {
  try {
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.resetToken).digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() } 
    });

    if (!user) {
      return res.status(400).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({ message: "Đổi mật khẩu thành công! Bạn có thể đăng nhập lại." });

  } catch (error) {
    next(error);
  }
};

// Logout
exports.logout = async (req, res, next) => {
  try {

    const user = await User.findById(req.user.id);
    if (user) {
        user.refreshToken = null;
        await user.save({ validateBeforeSave: false });
    }
    
    res.status(200).json({ message: "Đăng xuất thành công" });
  } catch (error) {
    next(error);
  }
};

// Verify OTP
exports.verifyAccount = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({
      email,
      otp,
      otpExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: "Mã OTP không đúng hoặc đã hết hạn" });
    }

    user.isVerified = true;
    user.otp = undefined;    
    user.otpExpire = undefined;
    await user.save({ validateBeforeSave: false });

    const tokens = generateTokens(user._id);
    user.refreshToken = tokens.refreshToken;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      message: "Kích hoạt tài khoản thành công!",
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin
      }
    });

  } catch (error) {
    next(error);
  }
};