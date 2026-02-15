const Coupon = require('../models/Coupon');

exports.createCoupon = async (req, res) => {
  try {
    const { code, discount, daysToExpire } = req.body;
    
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + (daysToExpire || 30)); 

    const coupon = await Coupon.create({
      code: code.toUpperCase(), 
      discount,
      expiryDate
    });

    res.status(201).json(coupon);
  } catch (error) {
    res.status(400).json({ message: 'Lỗi tạo mã: ' + error.message });
  }
};

exports.applyCoupon = async (req, res) => {
  try {
    const { code } = req.body;
    
    if(!code) return res.status(400).json({ message: "Vui lòng nhập mã giảm giá" });

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (!coupon) {
      return res.status(404).json({ message: 'Mã giảm giá không tồn tại' });
    }

    if (!coupon.isActive) {
      return res.status(400).json({ message: 'Mã này đang bị khóa' });
    }

    if (new Date() > coupon.expiryDate) {
      return res.status(400).json({ message: 'Mã này đã hết hạn sử dụng' });
    }

    res.status(200).json({
      success: true,
      discount: coupon.discount,
      code: coupon.code,
      message: `Áp dụng thành công! Giảm ${coupon.discount}%`
    });

  } catch (error) {
    res.status(500).json({ message: 'Lỗi server: ' + error.message });
  }
};