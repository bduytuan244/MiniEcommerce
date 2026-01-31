const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  customerName: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },

  // Danh sách sản phẩm mua
  orderItems: [
    {
      name: { type: String, required: true },
      qty: { type: Number, required: true },
      image: { type: String },
      price: { type: Number, required: true },
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
      },
    },
  ],

  // Thông tin thanh toán
  totalPrice: { type: Number, required: true, default: 0 },
  paymentMethod: { type: String, default: 'COD' },

  // Trạng thái đơn hàng
  status: { 
    type: String, 
    default: 'Chờ xác nhận',
    enum: [
      'Chờ xác nhận', 
      'Đã xác nhận', 
      'Đang đóng gói', 
      'Đang vận chuyển', 
      'Hoàn thành', 
      'Đã hủy', 
      'Trả hàng'
    ] 
  }
}, {
  timestamps: true 
});

module.exports = mongoose.model('Order', orderSchema);