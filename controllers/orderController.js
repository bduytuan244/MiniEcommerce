const Order = require('../models/Order');
const Product = require('../models/Products');
const User = require('../models/User'); 
const sendEmail = require('../utils/sendEmail');

exports.createOrder = async (req, res) => {
  try {
    const { orderItems, shippingInfo, paymentMethod } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: "Giỏ hàng rỗng" });
    }

    if (!shippingInfo || !shippingInfo.address || !shippingInfo.phone) {
        return res.status(400).json({ message: "Thiếu địa chỉ hoặc số điện thoại" });
    }

    const orderItemsProcessed = [];
    let calculatedTotalPrice = 0;

    for (const item of orderItems) {
      const productId = item.productId || item.product;
      const dbProduct = await Product.findById(productId);

      if (!dbProduct) {
        return res.status(404).json({ message: `Sản phẩm ID ${productId} không tồn tại` });
      }

      const itemTotalPrice = dbProduct.price * item.qty;
      calculatedTotalPrice += itemTotalPrice;

      orderItemsProcessed.push({
        product: dbProduct._id,
        name: dbProduct.name,
        price: dbProduct.price,
        image: dbProduct.images && dbProduct.images[0] ? dbProduct.images[0] : '', 
        qty: item.qty
      });
    }

    const order = new Order({
      orderItems: orderItemsProcessed,
      user: req.user._id || req.user.id,
      customerName: req.user.name || shippingInfo.fullName || "Khách hàng",
      address: shippingInfo.address,
      phone: shippingInfo.phone,
      paymentMethod,
      itemsPrice: calculatedTotalPrice,
      shippingPrice: 0,
      totalPrice: calculatedTotalPrice, 
      isPaid: false,
      status: 'Chờ xác nhận'
    });

    const createdOrder = await order.save();

    try {
        const userDetail = await User.findById(req.user._id || req.user.id);
        const emailToSend = userDetail ? userDetail.email : req.user.email;
        const nameToSend = userDetail ? userDetail.name : req.user.name;

        if (emailToSend && typeof sendEmail === 'function') {
            const itemsHtml = orderItemsProcessed.map(item => `
                <tr>
                    <td style="padding: 10px; border: 1px solid #ddd;">${item.name}</td>
                    <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${item.qty}</td>
                    <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">${(item.price * item.qty).toLocaleString('vi-VN')} đ</td>
                </tr>
            `).join('');

            const emailHtmlTemplate = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
                    <h2 style="color: #28a745; text-align: center;">Cảm ơn bạn đã đặt hàng! 🎉</h2>
                    <p>Xin chào <strong>${nameToSend}</strong>,</p>
                    <p>Chúng tôi đã nhận được đơn hàng <strong>#${createdOrder._id.toString().slice(-6).toUpperCase()}</strong> của bạn và đang tiến hành xử lý.</p>
                    
                    <h3 style="border-bottom: 2px solid #eee; padding-bottom: 5px;">📦 Chi tiết đơn hàng:</h3>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                        <thead>
                            <tr style="background-color: #f8f9fa;">
                                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Sản phẩm</th>
                                <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">SL</th>
                                <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Thành tiền</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHtml}
                        </tbody>
                    </table>
                    
                    <h3 style="text-align: right; color: #d32f2f;">Tổng cộng: ${calculatedTotalPrice.toLocaleString('vi-VN')} đ</h3>
                    
                    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-top: 20px;">
                        <p style="margin: 0 0 5px 0;"><strong>📍 Địa chỉ giao hàng:</strong> ${shippingInfo.address}</p>
                        <p style="margin: 0;"><strong>📞 Số điện thoại:</strong> ${shippingInfo.phone}</p>
                    </div>

                    <p style="margin-top: 20px; font-size: 0.9em; color: #666; text-align: center;">Bạn có thể đăng nhập vào website để theo dõi trạng thái đơn hàng của mình.</p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="text-align: center; font-weight: bold; color: #333;">Trân trọng,<br>Ban quản trị Mini Ecommerce</p>
                </div>
            `;

            await sendEmail({
                email: emailToSend,
                subject: `🎉 Xác nhận đơn hàng #${createdOrder._id.toString().slice(-6).toUpperCase()}`,
                message: `Xin chào ${nameToSend}, Cảm ơn bạn đã đặt hàng. Tổng tiền: ${calculatedTotalPrice.toLocaleString('vi-VN')}đ`, 
                html: emailHtmlTemplate 
            });
        }
    } catch (err) {
        console.error("Lỗi gửi mail:", err.message);
    }

    res.status(201).json(createdOrder);
  } catch (error) {
    res.status(500).json({ message: "Lỗi tạo đơn: " + error.message });
  }
};

exports.getOrders = async (req, res) => {
    try {
        const orders = await Order.find().populate('user', 'id name email').sort({ createdAt: -1 });
        res.status(200).json(orders);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.updateOrderStatus = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Không tìm thấy đơn" });

        const statusMap = {
            'Pending': 'Chờ xác nhận',
            'Processing': 'Đang đóng gói',
            'Shipped': 'Đang vận chuyển',
            'Delivered': 'Hoàn thành',
            'Cancelled': 'Đã hủy',
            'Returned': 'Trả hàng'
        };
        const newStatus = statusMap[req.body.status] || req.body.status;

        if (newStatus === 'Đã hủy' || newStatus === 'Trả hàng') {
             if (order.status !== 'Đã hủy' && order.status !== 'Trả hàng') {
                for (const item of order.orderItems) {
                    const product = await Product.findById(item.product);
                    if (product) {
                        product.stock = (product.stock || 0) + item.qty;
                        await product.save();
                    }
                }
            }
        }
        order.status = newStatus;
        if (newStatus === 'Hoàn thành') {
            order.isDelivered = true;
            order.deliveredAt = Date.now();
            order.isPaid = true;
            order.paidAt = Date.now();
        }
        await order.save();
        res.json({ message: "Cập nhật thành công", order });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.updateOrderToPaid = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (order) {
            order.isPaid = true;
            order.paidAt = Date.now();
            order.paymentResult = {
                id: req.body.id,
                status: 'COMPLETED',
                update_time: String(new Date()),
                email_address: req.body.email_address
            };
            const updatedOrder = await order.save();
            res.json(updatedOrder);
        } else {
            res.status(404).json({ message: "Order not found" });
        }
    } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id || req.user.id }).sort({ createdAt: -1 });
        res.status(200).json(orders);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('user', 'name email');
        if (order) {
            res.json(order);
        } else {
            res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server: ' + error.message });
    }
};