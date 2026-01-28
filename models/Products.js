const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  
  stock: { type: Number, required: true, default: 0 }, 
  
  price: { type: Number, required: true },
  originalPrice: { type: Number }, //Giá vốn
  
  description: { type: String },
  brand: { type: String },
  
  images: [{ type: String }], 
  
  category: { type: String, required: true },
  
  isActive: { type: Boolean, default: true }
}, { timestamps: true }); 

module.exports = mongoose.model('Product', productSchema);