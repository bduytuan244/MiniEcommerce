const Order = require('../models/Order');
const Product = require('../models/Products'); 

exports.createOrder = async (req, res) => {
  try {
    const { customerName, phone, address, orderItems, totalPrice } = req.body;

    if (orderItems && orderItems.length === 0) {
      return res.status(400).json({ message: "Giỏ hàng đang trống!" });
    }

    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      
      if (!product) {
        return res.status(404).json({ message: `Sản phẩm ${item.name} không tồn tại` });
      }
      if (product.stock < item.qty) {
        return res.status(400).json({ message: `Sản phẩm ${item.name} đã hết hàng (Chỉ còn ${product.stock})` });
      }

      product.stock = product.stock - item.qty;
      await product.save();
    }

    // Create order
    const order = new Order({
      user: req.user.id, 
      customerName,
      phone,
      address,
      orderItems,
      totalPrice
    });

    const createdOrder = await order.save();
    res.status(201).json({ message: "Đặt hàng thành công!", order: createdOrder });

  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};
exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate('user', 'name email').sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};
exports.updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (order) {
      order.status = req.body.status || order.status;
      const updatedOrder = await order.save();
      res.json({ message: "Cập nhật trạng thái thành công!", order: updatedOrder });
    } else {
      res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};