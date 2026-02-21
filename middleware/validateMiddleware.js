// Middleware kiểm tra dữ liệu bằng Joi schema
const validate = (schema) => {
    return (req, res, next) => {
        // Kiểm tra req.body dựa trên schema được truyền vào
        const { error } = schema.validate(req.body, { abortEarly: false });
        
        if (error) {
            // Nếu có lỗi, gom tất cả thông báo lỗi lại thành 1 mảng và trả về
            const errorMessage = error.details.map((detail) => detail.message).join(', ');
            return res.status(400).json({ message: errorMessage });
        }
        
        // Nếu dữ liệu chuẩn, cho phép đi tiếp vào Controller
        next();
    };
};

module.exports = validate;