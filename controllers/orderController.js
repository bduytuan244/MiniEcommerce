const Order = require('../models/Order');
const Product = require('../models/Products');
const User = require('../models/User'); 
const sendEmail = require('../utils/sendEmail');

exports.createOrder = async (req, res) => {
    try {
        const { orderItems, shippingInfo, paymentMethod, totalPrice } = req.body;

        if (!orderItems || orderItems.length === 0) {
            return res.status(400).json({ message: "Giỏ hàng rỗng" });
        }

        if (!shippingInfo || !shippingInfo.address || !shippingInfo.phone) {
            return res.status(400).json({ message: "Thiếu địa chỉ hoặc số điện thoại" });
        }

        const sellerGroups = {}; 
        let grandTotalCalculated = 0; 

        for (const item of orderItems) {
            const productId = item.productId || item.product;
            const dbProduct = await Product.findById(productId);

            if (!dbProduct) {
                return res.status(404).json({ message: `Sản phẩm ID ${productId} không tồn tại` });
            }

            const sellerIdStr = dbProduct.seller_id.toString();
            const itemTotalPrice = dbProduct.price * item.qty;
            grandTotalCalculated += itemTotalPrice;

            if (!sellerGroups[sellerIdStr]) {
                sellerGroups[sellerIdStr] = { items: [], total: 0 };
            }

            sellerGroups[sellerIdStr].items.push({
                product: dbProduct._id,
                name: dbProduct.name,
                price: dbProduct.price,
                image: dbProduct.images && dbProduct.images[0] ? dbProduct.images[0] : '', 
                qty: item.qty
            });
            sellerGroups[sellerIdStr].total += itemTotalPrice;
        }

        const parentTransactionId = 'TXN_' + Date.now(); 

        let discountRatio = 1;
        if (totalPrice && Number(totalPrice) > 0 && Number(totalPrice) < grandTotalCalculated) {
            discountRatio = Number(totalPrice) / grandTotalCalculated;
        }

        const createdOrders = [];

        for (const sellerId in sellerGroups) {
            const group = sellerGroups[sellerId];
            
            const finalGroupPrice = Math.round(group.total * discountRatio);

            const order = new Order({
                orderItems: group.items,
                user: req.user._id || req.user.id,
                customerName: req.user.name || shippingInfo.fullName || "Khách hàng",
                address: shippingInfo.address,
                phone: shippingInfo.phone,
                paymentMethod,
                itemsPrice: group.total, 
                shippingPrice: 0,
                totalPrice: finalGroupPrice, 
                isPaid: false,
                status: 'Chờ xác nhận',
                paymentResult: {
                    id: parentTransactionId
                }
            });

            const savedOrder = await order.save();
            createdOrders.push(savedOrder);
        }

        try {
            const userDetail = await User.findById(req.user._id || req.user.id);
            const emailToSend = userDetail ? userDetail.email : req.user.email;
            const nameToSend = userDetail ? userDetail.name : req.user.name;

            if (emailToSend && typeof sendEmail === 'function') {
                let allItemsHtml = '';
                createdOrders.forEach(ord => {
                    ord.orderItems.forEach(item => {
                        allItemsHtml += `
                            <tr>
                                <td style="padding: 10px; border: 1px solid #ddd;">${item.name}</td>
                                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${item.qty}</td>
                                <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">${(item.price * item.qty).toLocaleString('vi-VN')} đ</td>
                            </tr>
                        `;
                    });
                });

                const finalPriceToDisplay = totalPrice ? Number(totalPrice) : grandTotalCalculated;

                const emailHtmlTemplate = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
                        <h2 style="color: #28a745; text-align: center;">Cảm ơn bạn đã đặt hàng! 🎉</h2>
                        <p>Xin chào <strong>${nameToSend}</strong>,</p>
                        <p>Chúng tôi đã nhận được yêu cầu đặt hàng của bạn. (Mã phiên: ${parentTransactionId})</p>
                        
                        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                            <thead>
                                <tr style="background-color: #f8f9fa;">
                                    <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Sản phẩm</th>
                                    <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">SL</th>
                                    <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Thành tiền</th>
                                </tr>
                            </thead>
                            <tbody>${allItemsHtml}</tbody>
                        </table>
                        
                        <h3 style="text-align: right; color: #d32f2f;">Tổng cộng: ${finalPriceToDisplay.toLocaleString('vi-VN')} đ</h3>
                    </div>
                `;

                await sendEmail({
                    email: emailToSend,
                    subject: `🎉 Xác nhận đặt hàng thành công tại Mini Ecommerce`,
                    message: `Xin chào ${nameToSend}, Cảm ơn bạn đã đặt hàng.`, 
                    html: emailHtmlTemplate 
                });
            }
        } catch (err) {
            console.error("Lỗi gửi mail:", err.message);
        }

        res.status(201).json({ 
            message: "Tạo đơn thành công", 
            orders: createdOrders,
            _id: createdOrders[0]._id,
            transactionId: parentTransactionId 
        });

    } catch (error) {
        res.status(500).json({ message: "Lỗi tạo đơn: " + error.message });
    }
};

exports.getOrders = async (req, res) => {
    try {
        const { status, customer, product, date } = req.query;
        let queryConditions = {};

        if (status && status !== 'Tất cả') {
            queryConditions.status = status;
        }

        if (product) {
            queryConditions['orderItems.name'] = { $regex: product, $options: 'i' };
        }

        if (date) {
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);
            
            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);

            queryConditions.createdAt = {
                $gte: startDate,
                $lte: endDate
            };
        }

        let orders = await Order.find(queryConditions)
            .populate('user', 'id name email')
            .sort({ createdAt: -1 });

        if (customer) {
            const keyword = customer.toLowerCase();
            orders = orders.filter(order => {
                const name1 = order.customerName ? order.customerName.toLowerCase() : '';
                const name2 = (order.user && order.user.name) ? order.user.name.toLowerCase() : '';
                return name1.includes(keyword) || name2.includes(keyword);
            });
        }

        res.status(200).json(orders);
    } catch (error) { 
        res.status(500).json({ message: error.message }); 
    }
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

        const userId = req.user._id || req.user.id;
        const isAdmin = req.user.isAdmin;
        const isSeller = req.user.isSeller;
        const isOwner = order.user.toString() === userId.toString();

        if (!isAdmin && !isSeller && !isOwner) {
            return res.status(403).json({ message: "Bạn không có quyền thao tác trên đơn hàng này!" });
        }
        if (isOwner && !isAdmin && !isSeller) {
            if (newStatus !== 'Hoàn thành') {
                return res.status(403).json({ message: "Người mua chỉ được phép xác nhận Đã nhận hàng!" });
            }
            if (order.status !== 'Đang vận chuyển') {
                return res.status(400).json({ message: "Đơn hàng chưa được giao, không thể xác nhận!" });
            }
        }

        if (isSeller && !isAdmin) {
            if (newStatus !== 'Đang đóng gói' && newStatus !== 'Đang vận chuyển' && newStatus !== 'Đã hủy') {
                return res.status(403).json({ message: "Người bán chỉ được đóng gói, giao hàng hoặc từ chối đơn!" });
            }
            if (order.status === 'Đã hủy' || order.status === 'Hoàn thành') {
                 return res.status(400).json({ message: "Không thể thao tác trên đơn hàng đã đóng!" });
            }
        }

        if (order.status === 'Đã hủy') {
            return res.status(400).json({ message: "Đơn hàng này đã bị hủy, không thể thay đổi trạng thái!" });
        }
        if (order.status === 'Hoàn thành' && newStatus === 'Đã hủy') {
            return res.status(400).json({ message: "Đơn hàng đã giao thành công, không thể hủy!" });
        }

        if (newStatus === 'Đã hủy' || newStatus === 'Trả hàng') {
             if (order.status !== 'Đã hủy' && order.status !== 'Trả hàng') {
                for (const item of order.orderItems) {
                    const product = await Product.findById(item.product);
                    if (product) {
                        product.countInStock = (product.countInStock || 0) + item.qty;
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


exports.cancelOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        
        if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
        
        if (order.user.toString() !== req.user.id && !req.user.isAdmin) {
            return res.status(403).json({ message: "Không có quyền thao tác" });
        }

        if (order.status !== 'Chờ xác nhận' && order.status !== 'pending') {
            return res.status(400).json({ message: "Đơn hàng đã được xử lý, không thể hủy!" });
        }

        order.status = 'Đã hủy'; 
        await order.save();
        
        res.status(200).json({ message: "Hủy đơn hàng thành công", order });
    } catch (error) {
        res.status(500).json({ message: "Lỗi Server" });
    }
};

exports.getSellerOrders = async (req, res) => {
    try {
        const sellerId = req.user._id || req.user.id;

        const myProducts = await Product.find({ seller_id: sellerId }).select('_id');
        const myProductIds = myProducts.map(p => p._id);

        if (myProductIds.length === 0) {
            return res.status(200).json([]); 
        }

        const orders = await Order.find({
            $or: [
                { 'orderItems.product': { $in: myProductIds } },
                { 'orderItems.productId': { $in: myProductIds } }
            ]
        }).sort({ createdAt: -1 }).populate('user', 'name email');

        res.status(200).json(orders);
    } catch (error) {
        console.error("Lỗi lấy đơn hàng cho Seller:", error);
        res.status(500).json({ message: "Lỗi Server" });
    }
};