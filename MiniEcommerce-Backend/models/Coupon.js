const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    code: { 
        type: String, 
        required: true, 
        unique: true, 
        uppercase: true 
    },
    discount: { 
        type: Number, 
        required: true 
    },
    isActive: { 
        type: Boolean, 
        default: true 
    },
    expirationDate: { 
        type: Date, 
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Coupon', couponSchema);