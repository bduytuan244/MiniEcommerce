const Joi = require('joi');

const registerSchema = Joi.object({
    name: Joi.string().min(3).max(50).required().messages({
        'string.empty': 'Tên không được để trống',
        'string.min': 'Tên phải có ít nhất 3 ký tự',
        'any.required': 'Vui lòng cung cấp tên'
    }),
    email: Joi.string().email().required().messages({
        'string.empty': 'Email không được để trống',
        'string.email': 'Định dạng email không hợp lệ',
        'any.required': 'Vui lòng cung cấp email'
    }),
    password: Joi.string().min(6).required().messages({
        'string.empty': 'Mật khẩu không được để trống',
        'string.min': 'Mật khẩu phải có ít nhất 6 ký tự',
        'any.required': 'Vui lòng cung cấp mật khẩu'
    })
});

const loginSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.empty': 'Email không được để trống',
        'string.email': 'Định dạng email không hợp lệ'
    }),
    password: Joi.string().required().messages({
        'string.empty': 'Mật khẩu không được để trống'
    })
});

module.exports = {
    registerSchema,
    loginSchema
};