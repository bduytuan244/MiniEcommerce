const Coupon = require('../models/Coupon');

exports.createCoupon = async (req, res) => {
  try {
    const { code, discount, expiryDate } = req.body;
    const newCoupon = new Coupon({ code, discount, expiryDate });
    await newCoupon.save();
    res.status(201).json({ message: "Tạo mã giảm giá thành công!", coupon: newCoupon });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

exports.applyCoupon = async (req, res) => {
  try {
    const { code } = req.body;
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (!coupon) {
      return res.status(404).json({ message: "Mã giảm giá không tồn tại" });
    }

    if (new Date() > coupon.expiryDate) {
      return res.status(400).json({ message: "Mã giảm giá đã hết hạn" });
    }

    res.json({ message: "Áp dụng mã thành công!", discount: coupon.discount });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};