const crypto = require('crypto');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');

// Hàm tạo Token (Access & Refresh)
const generateTokens = (id) => {
  const accessToken = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
  const refreshToken = jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE,
  });
  return { accessToken, refreshToken };
};

// 1. ĐĂNG KÝ (REGISTER)
exports.register = async (req, res) => { 
  try {
    const { name, email, password } = req.body;

    // Kiểm tra xem email đã tồn tại chưa
    let user = await User.findOne({ email });
    if (user) {
        if (user.isVerified) {
            return res.status(400).json({ message: "Email này đã được sử dụng và kích hoạt." });
        }
        // Nếu đã đăng ký nhưng chưa kích hoạt -> Gửi lại mã OTP mới
        await User.findByIdAndDelete(user._id); 
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpire = Date.now() + 10 * 60 * 1000; // 10 phút

    user = await User.create({
      name, email, password, otp, otpExpire, isVerified: false
    });

    try {
      await sendEmail({
        email: user.email,
        subject: 'Mã OTP Xác thực tài khoản - Mini Ecommerce',
        message: `Xin chào ${user.name},\n\nMã xác thực (OTP) của bạn là: ${otp}\nMã này có hiệu lực trong 10 phút.\n\nCảm ơn bạn!`
      });
      
      return res.status(200).json({ 
        message: "Đăng ký thành công! Vui lòng kiểm tra email để lấy mã OTP.",
        email: user.email 
      });

    } catch (emailError) {
      console.error("Lỗi gửi mail:", emailError);
      await User.findByIdAndDelete(user._id); // Xóa user nếu gửi mail lỗi để họ đăng ký lại
      return res.status(500).json({ message: "Lỗi gửi email OTP. Vui lòng thử lại sau." });
    }

  } catch (error) {
    console.error("Lỗi Register:", error);
    return res.status(500).json({ message: "Lỗi Server: " + error.message });
  }
};

// 2. XÁC THỰC TÀI KHOẢN (VERIFY OTP)
exports.verifyAccount = async (req, res) => { 
  try {
    const { email, otp } = req.body;
    
    // Tìm user khớp email, khớp OTP và OTP chưa hết hạn
    const user = await User.findOne({
      email, 
      otp, 
      otpExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: "Mã OTP không chính xác hoặc đã hết hạn!" });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpire = undefined;
    
    const tokens = generateTokens(user._id);
    user.refreshToken = tokens.refreshToken;
    
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      message: "Kích hoạt tài khoản thành công!",
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

// 3. ĐĂNG NHẬP (LOGIN)
exports.login = async (req, res) => { 
  try {
    const { email, password } = req.body;
    // Đã xóa dòng if(!email || !password) vì Joi Middleware đã lo việc này

    const user = await User.findOne({ email }).select('+password');
    
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Email hoặc mật khẩu không chính xác!" });
    }
    
    if (!user.isVerified) {
      return res.status(401).json({ message: "Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email!" });
    }

    const tokens = generateTokens(user._id);
    user.refreshToken = tokens.refreshToken;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      message: "Đăng nhập thành công",
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: { id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin }
    });

  } catch (error) {
    console.error("Lỗi Login:", error);
    return res.status(500).json({ message: "Lỗi Server: " + error.message });
  }
};

// 4. LÀM MỚI TOKEN (REFRESH TOKEN)
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ message: "Vui lòng cung cấp Refresh Token" });

    const user = await User.findOne({ refreshToken });
    if (!user) return res.status(403).json({ message: "Refresh Token không hợp lệ hoặc đã bị đăng xuất" });

    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, decoded) => {
      if (err) return res.status(403).json({ message: "Refresh Token đã hết hạn, vui lòng đăng nhập lại" });
      
      const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
      res.json({ accessToken });
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// 5. ĐĂNG XUẤT (LOGOUT)
exports.logout = async (req, res) => {
  try {
    if (req.user) {
        const user = await User.findById(req.user.id);
        if (user) {
            user.refreshToken = null; // Xóa refresh token khỏi database
            await user.save({ validateBeforeSave: false });
        }
    }
    return res.status(200).json({ message: "Đăng xuất thành công" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// 6. QUÊN MẬT KHẨU (FORGOT PASSWORD)
exports.forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(404).json({ message: "Email này không tồn tại trong hệ thống" });

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 phút
    
    await user.save({ validateBeforeSave: false });

    // Tạo link reset mật khẩu (Dẫn về trang Frontend của bạn)
    const resetUrl = `http://localhost:5000/auth/reset-password.html?token=${resetToken}`;
    
    try {
      await sendEmail({
        email: user.email,
        subject: 'Yêu cầu Khôi phục mật khẩu',
        message: `Bạn vừa yêu cầu đặt lại mật khẩu.\nVui lòng click vào link dưới đây để đặt lại mật khẩu mới (Link có hiệu lực trong 10 phút):\n\n${resetUrl}\n\nNếu bạn không yêu cầu, vui lòng bỏ qua email này.`
      });
      return res.status(200).json({ message: "Đã gửi link khôi phục mật khẩu vào email của bạn" });
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({ message: "Không thể gửi email, vui lòng thử lại sau!" });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// 7. ĐẶT LẠI MẬT KHẨU (RESET PASSWORD)
exports.resetPassword = async (req, res) => {
  try {
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.resetToken).digest('hex');
    
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ message: "Link khôi phục không hợp lệ hoặc đã hết hạn" });

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save(); // Chạy qua middleware mã hóa password trong User model

    return res.status(200).json({ message: "Đổi mật khẩu thành công! Bạn có thể đăng nhập ngay." });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};