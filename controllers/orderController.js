const Order = require('../models/Order');
const Product = require('../models/Product'); // ⚠️ Đảm bảo tên file model là Product.js (số ít) hoặc Products.js tùy thư mục của bạn
const sendEmail = require('../utils/sendEmail');

// 1. TẠO ĐƠN HÀNG (Đã sửa lỗi Enum & Address)
exports.createOrder = async (req, res) => {
  try {
    const {
      orderItems,
      shippingInfo,    // Frontend gửi cục này { address, phone, ... }
      paymentMethod,
    } = req.body;

    console.log("📦 Dữ liệu nhận:", req.body);

    // Kiểm tra đầu vào cơ bản
    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: "Giỏ hàng rỗng" });
    }

    if (!shippingInfo || !shippingInfo.address || !shippingInfo.phone) {
        return res.status(400).json({ message: "Thiếu địa chỉ hoặc số điện thoại giao hàng" });
    }

    // --- BƯỚC 1: XỬ LÝ SẢN PHẨM & TÍNH GIÁ ---
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

      // Tạo item đúng chuẩn Schema
      orderItemsProcessed.push({
        product: dbProduct._id,
        name: dbProduct.name,
        price: dbProduct.price,
        image: dbProduct.images && dbProduct.images[0] ? dbProduct.images[0] : '', 
        qty: item.qty
      });
    }

    // --- BƯỚC 2: TẠO ORDER (Khớp với Model Order mới) ---
    const order = new Order({
      orderItems: orderItemsProcessed,
      
      // Map User & Tên khách (Lấy từ Token hoặc ShippingInfo nếu Token thiếu name)
      user: req.user._id || req.user.id,
      customerName: req.user.name || shippingInfo.fullName || "Khách hàng", 

      // Map Địa chỉ & SĐT (Bung ra root theo yêu cầu Model)
      address: shippingInfo.address,
      phone: shippingInfo.phone,

      paymentMethod,
      itemsPrice: calculatedTotalPrice,
      shippingPrice: 0,
      totalPrice: calculatedTotalPrice, 
      
      isPaid: false,
      
      // 👇 QUAN TRỌNG: Phải dùng Tiếng Việt để khớp với Enum trong Model
      status: 'Chờ xác nhận' 
    });

    const createdOrder = await order.save();
    console.log("✅ Tạo đơn thành công:", createdOrder._id);

    // --- BƯỚC 3: GỬI EMAIL ---
    try {
        if (typeof sendEmail === 'function') {
            await sendEmail({
                email: req.user.email,
                subject: `Xác nhận đơn hàng #${createdOrder._id}`,
                message: `Cảm ơn bạn đã đặt hàng. Tổng tiền: ${calculatedTotalPrice.toLocaleString()}đ`
            });
        }
    } catch (err) {
        console.error("⚠️ Lỗi gửi mail:", err.message);
    }

    res.status(201).json(createdOrder);

  } catch (error) {
    console.error("❌ LỖI CONTROLLER:", error);
    res.status(500).json({ message: "Lỗi tạo đơn hàng: " + error.message });
  }
};

// 2. LẤY DANH SÁCH ĐƠN HÀNG
exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find()
        .populate('user', 'id name email') 
        .sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// 3. CẬP NHẬT TRẠNG THÁI (Map từ Anh -> Việt)
exports.updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });

    // 👇 Bảng dịch trạng thái (Frontend gửi Anh -> Lưu vào DB Việt)
    const statusMap = {
        'Pending': 'Chờ xác nhận',
        'Processing': 'Đang đóng gói',
        'Shipped': 'Đang vận chuyển',
        'Delivered': 'Hoàn thành',
        'Cancelled': 'Đã hủy',
        'Returned': 'Trả hàng'
    };

    // Lấy trạng thái tiếng Việt (nếu không tìm thấy trong map thì giữ nguyên giá trị gửi lên)
    const newStatus = statusMap[req.body.status] || req.body.status;

    // Logic trả hàng vào kho khi Hủy
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

    const updatedOrder = await order.save();
    res.json({ message: `Đã cập nhật trạng thái: ${newStatus}`, order: updatedOrder });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// 4. CẬP NHẬT THANH TOÁN (Cho online payment)
exports.updateOrderToPaid = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (order) {
      order.isPaid = true;
      order.paidAt = Date.now();
      order.paymentResult = {
        id: req.body.id || 'MOCK_ID', 
        status: 'COMPLETED',
        update_time: String(new Date()),
        email_address: req.body.email_address || req.user.email,
      };

      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// 5. LẤY ĐƠN HÀNG CỦA TÔI
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id || req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy danh sách đơn hàng" });
  }
};