const Coupon = require('../models/Coupon');

exports.createCoupon = async (req, res) => {
    try {
        const { code, discount, expirationDate } = req.body;
        
        const couponExists = await Coupon.findOne({ code });
        if (couponExists) return res.status(400).json({ message: "Mã giảm giá này đã tồn tại!" });

        const coupon = await Coupon.create({ code, discount, expirationDate });
        res.status(201).json({ message: "Tạo mã thành công", coupon });
    } catch (error) {
        res.status(500).json({ message: "Lỗi server: " + error.message });
    }
};

exports.getCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find().sort({ createdAt: -1 });
        res.json(coupons);
    } catch (error) {
        res.status(500).json({ message: "Lỗi server: " + error.message });
    }
};

exports.deleteCoupon = async (req, res) => {
    try {
        await Coupon.findByIdAndDelete(req.params.id);
        res.json({ message: "Đã xóa mã giảm giá!" });
    } catch (error) {
        res.status(500).json({ message: "Lỗi server: " + error.message });
    }
};

exports.applyCoupon = async (req, res) => {
    try {
        const { code } = req.body;
        
        const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
        
        if (!coupon) {
            return res.status(404).json({ message: "Mã giảm giá không tồn tại hoặc đã bị khóa!" });
        }
        
        if (new Date(coupon.expirationDate) < new Date()) {
            return res.status(400).json({ message: "Mã giảm giá này đã hết hạn!" });
        }

        res.json({ 
            message: "Áp dụng mã thành công!", 
            discount: coupon.discount 
        });
    } catch (error) {
        res.status(500).json({ message: "Lỗi server: " + error.message });
    }
};