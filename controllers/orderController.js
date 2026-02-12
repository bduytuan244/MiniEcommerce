const Order = require('../models/Order');
const Product = require('../models/Products'); 

exports.createOrder = async (req, res) => {
  try {
    const {
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
    } = req.body;

    if (orderItems && orderItems.length === 0) {
      return res.status(400).json({ message: "Giỏ hàng rỗng" });
    }

    const order = new Order({
      orderItems,
      user: req.user._id, 
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
    });

    const createdOrder = await order.save();

    const message = `
      Xin chào ${req.user.name},

      Cảm ơn bạn đã đặt hàng tại Mini Ecommerce!
      Đơn hàng của bạn đã được tiếp nhận thành công.

      Mã đơn hàng: ${createdOrder._id}
      Tổng tiền: ${createdOrder.totalPrice.toLocaleString('vi-VN')} đ
      Địa chỉ giao: ${createdOrder.shippingAddress.address}, ${createdOrder.shippingAddress.city}
      
      Chúng tôi sẽ sớm đóng gói và gửi hàng cho bạn.
      
      Trân trọng,
      Đội ngũ Mini Ecommerce
    `;

    try {
      await sendEmail({
        email: req.user.email, 
        subject: `Xác nhận đơn hàng #${createdOrder._id}`,
        message: message
      });
      console.log("Đã gửi email xác nhận đơn hàng!");
    } catch (error) {
      console.error("Lỗi gửi email:", error.message);
    }

    res.status(201).json(createdOrder);

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
    if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });

    const newStatus = req.body.status;

    if (newStatus === 'Đã hủy' || newStatus === 'Trả hàng') {

      if (order.status !== 'Đã hủy' && order.status !== 'Trả hàng') {
        for (const item of order.orderItems) {
          const product = await Product.findById(item.product);
          if (product) {
            product.stock += item.qty; 
            await product.save();
          }
        }
      }
    }

    order.status = newStatus;
    const updatedOrder = await order.save();
    
    res.json({ message: `Đã cập nhật trạng thái: ${newStatus}`, order: updatedOrder });

  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

exports.updateOrderToPaid = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (order) {
      order.isPaid = true;
      order.paidAt = Date.now();
      
      order.paymentResult = {
        id: req.body.id || 'MOCK_PAYMENT_ID_' + Date.now(), 
        status: req.body.status || 'COMPLETED',
        update_time: String(new Date()),
        email_address: req.body.email_address || req.user.email,
      };

      const updatedOrder = await order.save();

      res.json({
        message: "Thanh toán giả lập thành công!",
        order: updatedOrder
      });
    } else {
      res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy danh sách đơn hàng" });
  }
};