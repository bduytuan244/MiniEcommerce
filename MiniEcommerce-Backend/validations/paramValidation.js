const Joi = require('joi');

const idSchema = Joi.object({
    id: Joi.string().hex().length(24).required().messages({
        'string.hex': 'ID không hợp lệ (Phải là chuỗi Hexadecimal)',
        'string.length': 'ID không hợp lệ (Độ dài chuẩn MongoDB là 24 ký tự)',
        'any.required': 'Vui lòng cung cấp ID'
    })
}).unknown(true);

module.exports = { idSchema };