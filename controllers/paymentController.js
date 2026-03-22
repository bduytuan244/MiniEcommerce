const crypto = require('crypto');
const Order = require('../models/Order');

exports.createPaymentUrl = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });

        let date = new Date();
        let createDate = date.getFullYear() +
            ('0' + (date.getMonth() + 1)).slice(-2) +
            ('0' + date.getDate()).slice(-2) +
            ('0' + date.getHours()).slice(-2) +
            ('0' + date.getMinutes()).slice(-2) +
            ('0' + date.getSeconds()).slice(-2);
        
        let ipAddr = '127.0.0.1'; 
        let tmnCode = 'CGXZLS0Z';
        let secretKey = 'XNBCJFAKAZQSGTARRLGCHVZWCIOIGSHN';
        let vnpUrl = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
        let returnUrl = 'http://localhost:5000/api/payment/vnpay_return';
        
        let amount = Math.floor(Number(order.totalPrice || 0) * 100);
        
        let vnp_Params = {};
        vnp_Params['vnp_Version'] = '2.1.0';
        vnp_Params['vnp_Command'] = 'pay';
        vnp_Params['vnp_TmnCode'] = tmnCode;
        vnp_Params['vnp_Locale'] = 'vn';
        vnp_Params['vnp_CurrCode'] = 'VND';
        
        vnp_Params['vnp_TxnRef'] = order._id.toString() + date.getTime().toString(); 
        
        vnp_Params['vnp_OrderInfo'] = 'ThanhToanDonHangVNPAY';
        vnp_Params['vnp_OrderType'] = 'other';
        vnp_Params['vnp_Amount'] = amount;
        vnp_Params['vnp_ReturnUrl'] = returnUrl;
        vnp_Params['vnp_IpAddr'] = ipAddr;
        vnp_Params['vnp_CreateDate'] = createDate;

        let sortedParams = {};
        let keys = Object.keys(vnp_Params).sort();
        for (let i = 0; i < keys.length; i++) {
            sortedParams[keys[i]] = encodeURIComponent(vnp_Params[keys[i]]).replace(/%20/g, '+');
        }

        let signData = [];
        for (let key in sortedParams) {
            signData.push(key + '=' + sortedParams[key]);
        }
        let signString = signData.join('&');

        let hmac = crypto.createHmac("sha512", secretKey);
        let signed = hmac.update(new Buffer.from(signString, 'utf-8')).digest("hex"); 
        
        let finalUrl = vnpUrl + '?' + signString + '&vnp_SecureHash=' + signed;

        res.status(200).json({ url: finalUrl });
    } catch (error) {
        res.status(500).json({ message: "Lỗi tạo link thanh toán", error: error.message });
    }
};

exports.vnpayReturn = async (req, res) => {
    let vnp_Params = req.query;
    let secureHash = vnp_Params['vnp_SecureHash'];

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    let sortedParams = {};
    let keys = Object.keys(vnp_Params).sort();
    for (let i = 0; i < keys.length; i++) {
        sortedParams[keys[i]] = encodeURIComponent(vnp_Params[keys[i]]).replace(/%20/g, '+');
    }

    let secretKey = 'XNBCJFAKAZQSGTARRLGCHVZWCIOIGSHN';
    let signData = [];
    for (let key in sortedParams) {
        signData.push(key + '=' + sortedParams[key]);
    }
    let signString = signData.join('&');
    let hmac = crypto.createHmac("sha512", secretKey);
    let signed = hmac.update(new Buffer.from(signString, 'utf-8')).digest("hex");     

    if(secureHash === signed){
        if(vnp_Params['vnp_ResponseCode'] == '00') {
            const txnRef = vnp_Params['vnp_TxnRef'];
            const orderId = txnRef.substring(0, 24); 
            
            await Order.findByIdAndUpdate(orderId, {
                isPaid: true,
                paidAt: Date.now(),
                paymentMethod: 'VNPAY'
            });
            res.redirect('http://127.0.0.1:5500/home/index.html?payment=success'); 
        } else {
            res.redirect('http://127.0.0.1:5500/home/index.html?payment=failed');
        }
    } else{
        res.redirect('http://127.0.0.1:5500/home/index.html?payment=invalid');
    }
};