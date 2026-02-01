const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

const { check } = require('express-validator');
const { checkValidation } = require('../middleware/validate');

router.get('/', productController.getProducts);
router.get('/:id', productController.getProductById);

router.post('/', 
  verifyToken, 
  verifyAdmin, 
  [
    check('name', 'Tên sản phẩm là bắt buộc').not().isEmpty(),
    check('price', 'Giá phải là số và lớn hơn 0').isFloat({ gt: 0 }),
    check('category', 'Danh mục là bắt buộc').not().isEmpty(),
    check('brand', 'Thương hiệu là bắt buộc').not().isEmpty()
  ],
  checkValidation, 
  productController.createProduct
);

router.put('/:id', verifyToken, verifyAdmin, productController.updateProduct);

router.delete('/:id', verifyToken, verifyAdmin, productController.deleteProduct);

module.exports = router;