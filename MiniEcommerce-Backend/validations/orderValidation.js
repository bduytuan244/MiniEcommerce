const Joi = require('joi');

const createOrderSchema = Joi.object({
    orderItems: Joi.array().min(1).required().messages({ 
        'array.min': 'Đơn hàng phải có ít nhất 1 sản phẩm', 
        'any.required': 'Thiếu danh sách sản phẩm' 
    }),
    address: Joi.string().required().messages({ 
        'any.required': 'Vui lòng cung cấp địa chỉ giao hàng', 
        'string.empty': 'Địa chỉ không được để trống' 
    }),
    phone: Joi.string().required().messages({ 
        'any.required': 'Vui lòng cung cấp số điện thoại', 
        'string.empty': 'Số điện thoại không được để trống' 
    }),
    customerName: Joi.string().required().messages({ 
        'any.required': 'Vui lòng cung cấp tên người nhận', 
        'string.empty': 'Tên người nhận không được để trống' 
    }),
    paymentMethod: Joi.string().required().messages({ 
        'any.required': 'Vui lòng chọn phương thức thanh toán' 
    }),
    totalPrice: Joi.number().min(0).required()
}).unknown(true);

const updateStatusSchema = Joi.object({
    status: Joi.string().valid('Chờ xác nhận', 'Đang đóng gói', 'Đang vận chuyển', 'Hoàn thành', 'Đã hủy', 'Trả hàng').required().messages({
        'any.only': 'Trạng thái đơn hàng không hợp lệ',
        'any.required': 'Vui lòng cung cấp trạng thái mới'
    })
}).unknown(true);

module.exports = { createOrderSchema, updateStatusSchema };