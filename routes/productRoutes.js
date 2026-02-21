const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

// Import Cloudinary upload
const upload = require('../config/cloudinary');

// Import Joi Validation (Thay thế hoàn toàn cho express-validator)
const validate = require('../middleware/validateMiddleware');
const { createProductSchema, updateProductSchema } = require('../validations/productValidation');

// 1. Xem danh sách & Xem chi tiết (Ai cũng xem được)
router.get('/', productController.getProducts);
router.get('/:id', productController.getProductById);

// 2. Thêm sản phẩm mới
router.post('/', 
  verifyToken, 
  verifyAdmin,
  upload.array('images', 5), // ⚠️ Xử lý file ảnh trước để lấy req.body
  validate(createProductSchema), // ⚠️ Sau đó mới cho Joi vào kiểm tra dữ liệu chữ
  productController.createProduct
);

// 3. Cập nhật sản phẩm
router.put('/:id', 
  verifyToken, 
  verifyAdmin, 
  upload.array('images', 5), // Nếu sửa cũng có up ảnh thì gắn upload vào đây
  validate(updateProductSchema), // Dùng luật update (cho phép gửi lên 1 vài trường)
  productController.updateProduct
);

// 4. Xóa sản phẩm
router.delete('/:id', 
  verifyToken, 
  verifyAdmin, 
  productController.deleteProduct
);

module.exports = router;