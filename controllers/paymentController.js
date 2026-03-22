const crypto = require('crypto');
const querystring = require('querystring');
const moment = require('moment');
const Order = require('../models/Order');

exports.createPaymentUrl = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });

        let date = new Date();
        let createDate = moment(date).format('YYYYMMDDHHmmss');
        
        let ipAddr = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

        let tmnCode = process.env.vnp_TmnCode;
        let secretKey = process.env.vnp_HashSecret;
        let vnpUrl = process.env.vnp_Url;
        let returnUrl = process.env.vnp_ReturnUrl;
        
        let amount = order.totalPrice;
        let bankCode = '';
        
        let vnp_Params = {};
        vnp_Params['vnp_Version'] = '2.1.0';
        vnp_Params['vnp_Command'] = 'pay';
        vnp_Params['vnp_TmnCode'] = tmnCode;
        vnp_Params['vnp_Locale'] = 'vn';
        vnp_Params['vnp_CurrCode'] = 'VND';
        vnp_Params['vnp_TxnRef'] = order._id.toString(); 
        vnp_Params['vnp_OrderInfo'] = 'Thanh toan don hang ' + order._id.toString();
        vnp_Params['vnp_OrderType'] = 'other';
        vnp_Params['vnp_Amount'] = amount * 100; 
        vnp_Params['vnp_ReturnUrl'] = returnUrl;
        vnp_Params['vnp_IpAddr'] = ipAddr;
        vnp_Params['vnp_CreateDate'] = createDate;
        if(bankCode !== null && bankCode !== ''){
            vnp_Params['vnp_BankCode'] = bankCode;
        }

        vnp_Params = sortObject(vnp_Params);

        let signData = querystring.stringify(vnp_Params, { encode: false });
        let hmac = crypto.createHmac("sha512", secretKey);
        let signed = hmac.update(new Buffer.from(signData, 'utf-8')).digest("hex"); 
        vnp_Params['vnp_SecureHash'] = signed;
        vnpUrl += '?' + querystring.stringify(vnp_Params, { encode: false });

        res.status(200).json({ url: vnpUrl });
    } catch (error) {
        res.status(500).json({ message: "Lỗi tạo link thanh toán", error: error.message });
    }
};

exports.vnpayReturn = async (req, res) => {
    let vnp_Params = req.query;
    let secureHash = vnp_Params['vnp_SecureHash'];

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    vnp_Params = sortObject(vnp_Params);

    let secretKey = process.env.vnp_HashSecret;
    let signData = querystring.stringify(vnp_Params, { encode: false });
    let hmac = crypto.createHmac("sha512", secretKey);
    let signed = hmac.update(new Buffer.from(signData, 'utf-8')).digest("hex");     

    if(secureHash === signed){
        if(vnp_Params['vnp_ResponseCode'] == '00') {
            const orderId = vnp_Params['vnp_TxnRef'];
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

function sortObject(obj) {
	let sorted = {};
	let str = [];
	let key;
	for (key in obj){
		if (obj.hasOwnProperty(key)) { str.push(encodeURIComponent(key)); }
	}
	str.sort();
    for (key = 0; key < str.length; key++) {
        sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
    }
    return sorted;
}