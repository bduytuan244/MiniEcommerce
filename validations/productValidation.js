const Joi = require('joi');

// 1. Luật kiểm tra khi THÊM MỚI sản phẩm
const createProductSchema = Joi.object({
    name: Joi.string().required().messages({
        'string.empty': 'Tên sản phẩm không được để trống',
        'any.required': 'Vui lòng nhập tên sản phẩm'
    }),
    price: Joi.number().min(0).required().messages({
        'number.base': 'Giá tiền phải là một số',
        'number.min': 'Giá tiền không được nhỏ hơn 0',
        'any.required': 'Vui lòng nhập giá tiền'
    }),
    countInStock: Joi.number().min(0).required().messages({
        'number.base': 'Số lượng kho phải là một số',
        'number.min': 'Số lượng kho không được nhỏ hơn 0',
        'any.required': 'Vui lòng nhập số lượng tồn kho'
    }),
    brand: Joi.string().required().messages({
        'string.empty': 'Thương hiệu không được để trống',
        'any.required': 'Vui lòng nhập thương hiệu'
    }),
    category: Joi.string().required().messages({
        'string.empty': 'Danh mục không được để trống',
        'any.required': 'Vui lòng nhập danh mục'
    }),
    description: Joi.string().allow('').optional(), // Cho phép để trống
    images: Joi.array().items(Joi.string()).optional() // Là một mảng chứa các link ảnh
});

// 2. Luật kiểm tra khi CẬP NHẬT sản phẩm (Các trường không bắt buộc phải có, nhưng nếu có thì phải đúng luật)
const updateProductSchema = Joi.object({
    name: Joi.string().messages({ 'string.empty': 'Tên sản phẩm không được để trống' }),
    price: Joi.number().min(0).messages({
        'number.base': 'Giá tiền phải là một số',
        'number.min': 'Giá tiền không được nhỏ hơn 0'
    }),
    countInStock: Joi.number().min(0).messages({
        'number.base': 'Số lượng kho phải là một số',
        'number.min': 'Số lượng kho không được nhỏ hơn 0'
    }),
    brand: Joi.string().messages({ 'string.empty': 'Thương hiệu không được để trống' }),
    category: Joi.string().messages({ 'string.empty': 'Danh mục không được để trống' }),
    description: Joi.string().allow('').optional(),
    images: Joi.array().items(Joi.string()).optional()
}).min(1); // Phải gửi lên ít nhất 1 trường để cập nhật

module.exports = {
    createProductSchema,
    updateProductSchema
};