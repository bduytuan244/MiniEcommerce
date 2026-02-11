const crypto = require('crypto');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');

// --- Helper: Tạo Token ---
const generateTokens = (id) => {
  const accessToken = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
  const refreshToken = jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE,
  });
  return { accessToken, refreshToken };
};

// 1. REGISTER
exports.register = async (req, res) => { // ❌ Bỏ tham số next
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "Email này đã được sử dụng" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpire = Date.now() + 10 * 60 * 1000;

    // Tạo user tạm
    const user = await User.create({
      name, email, password, otp, otpExpire, isVerified: false
    });

    // Gửi mail
    try {
      await sendEmail({
        email: user.email,
        subject: 'Mã OTP Xác thực tài khoản',
        message: `Mã xác thực của bạn là: ${otp}\nMã này có hiệu lực trong 10 phút.`
      });
      
      return res.status(200).json({ 
        message: "Đăng ký thành công! Vui lòng kiểm tra email để lấy mã OTP.",
        email: user.email 
      });

    } catch (emailError) {
      console.error("Lỗi gửi mail:", emailError);
      // Nếu gửi mail lỗi thì xóa user vừa tạo để họ đăng ký lại được
      await User.findByIdAndDelete(user._id);
      return res.status(500).json({ message: "Lỗi gửi email OTP. Vui lòng thử lại sau." });
    }

  } catch (error) {
    console.error("Lỗi Register:", error);
    return res.status(500).json({ message: "Lỗi Server: " + error.message });
  }
};

// 2. VERIFY OTP
exports.verifyAccount = async (req, res) => { // ❌ Bỏ tham số next
  try {
    const { email, otp } = req.body;
    
    // Tìm user có email, otp khớp VÀ chưa hết hạn
    const user = await User.findOne({
      email, 
      otp, 
      otpExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: "Mã OTP sai hoặc đã hết hạn" });
    }

    // Kích hoạt
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpire = undefined;
    await user.save({ validateBeforeSave: false });

    // Tạo token đăng nhập luôn
    const tokens = generateTokens(user._id);
    user.refreshToken = tokens.refreshToken;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      message: "Kích hoạt thành công!",
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin
      }
    });

  } catch (error) {
    console.error("Lỗi Verify:", error);
    return res.status(500).json({ message: "Lỗi Server: " + error.message });
  }
};

// 3. LOGIN
exports.login = async (req, res) => { // ❌ Bỏ tham số next
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Thiếu email/pass" });

    const user = await User.findOne({ email }).select('+password');
    
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Sai thông tin đăng nhập" });
    }
    
    if (!user.isVerified) {
      return res.status(401).json({ message: "Tài khoản chưa kích hoạt (Check mail OTP)" });
    }

    const tokens = generateTokens(user._id);
    user.refreshToken = tokens.refreshToken;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: { id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin }
    });

  } catch (error) {
    console.error("Lỗi Login:", error);
    return res.status(500).json({ message: "Lỗi Server: " + error.message });
  }
};

// 4. REFRESH TOKEN
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ message: "Thiếu token" });

    const user = await User.findOne({ refreshToken });
    if (!user) return res.status(403).json({ message: "Token không hợp lệ" });

    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, decoded) => {
      if (err) return res.status(403).json({ message: "Token hết hạn" });
      const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
      res.json({ accessToken });
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// 5. LOGOUT
exports.logout = async (req, res) => {
  try {
    if (req.user) {
        const user = await User.findById(req.user.id);
        if (user) {
            user.refreshToken = null;
            await user.save({ validateBeforeSave: false });
        }
    }
    return res.status(200).json({ message: "Đăng xuất thành công" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// 6. FORGOT & RESET PASSWORD
exports.forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(404).json({ message: "Email không tồn tại" });

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    // Sửa lại đường dẫn reset password cho đúng Frontend
    const resetUrl = `http://localhost:5000/auth/reset-password.html?token=${resetToken}`;
    
    try {
      await sendEmail({
        email: user.email,
        subject: 'Khôi phục mật khẩu',
        message: `Click link: ${resetUrl}`
      });
      return res.status(200).json({ message: "Đã gửi mail reset password" });
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({ message: "Lỗi gửi mail" });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.resetToken).digest('hex');
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ message: "Token lỗi hoặc hết hạn" });

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    return res.status(200).json({ message: "Đổi mật khẩu thành công" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};