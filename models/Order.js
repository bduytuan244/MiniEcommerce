const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
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
    default: 'Pending', 
    enum: ['Pending', 'Shipping', 'Delivered', 'Cancelled'] 
  }
}, {
  timestamps: true 
});

module.exports = mongoose.model('Order', orderSchema);