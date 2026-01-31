const Order = require('../models/Order');

exports.createOrder = async (req, res) => {
  try {
    const { customerName, phone, address, orderItems, totalPrice } = req.body;

    if (orderItems && orderItems.length === 0) {
      return res.status(400).json({ message: "Giỏ hàng đang trống!" });
    }

    const order = new Order({
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

exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (order) {
      order.status = req.body.status || order.status
      const updatedOrder = await order.save();
      res.json({ message: "Cập nhật trạng thái thành công!", order: updatedOrder });
    } else {
      res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};