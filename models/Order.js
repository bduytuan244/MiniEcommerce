const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  customerName: { type: String, required: true }, 
  phone: { type: String, required: true },
  address: { type: String, required: true },
  
  //list hàng
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true }
  }],
  
  totalAmount: { type: Number, required: true },
  //Trạng thái
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Shipping', 'Completed', 'Cancelled'],
    default: 'Pending'
  },
  
  paymentMethod: { type: String, default: 'COD' }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);