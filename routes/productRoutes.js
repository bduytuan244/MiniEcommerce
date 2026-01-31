const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

router.post('/', productController.createProduct);
router.get('/', productController.getProducts);

router.post('/', verifyToken, verifyAdmin, productController.createProduct);
router.put('/:id', verifyToken, verifyAdmin, productController.updateProduct);
router.delete('/:id', verifyToken, verifyAdmin, productController.deleteProduct);

module.exports = router;