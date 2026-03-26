const Joi = require('joi');

const categorySchema = Joi.object({
    name: Joi.string().required().messages({ 
        'any.required': 'Tên danh mục không được để trống', 
        'string.empty': 'Tên danh mục không được để trống' 
    }),
    description: Joi.string().allow('', null)
}).unknown(true);

module.exports = { categorySchema };