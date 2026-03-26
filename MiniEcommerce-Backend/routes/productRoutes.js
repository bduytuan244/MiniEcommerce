const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { verifyToken, verifyAdmin, verifySeller } = require('../middleware/authMiddleware');

const upload = require('../config/cloudinary');
const validate = require('../middleware/validateMiddleware');
const { createProductSchema, updateProductSchema } = require('../validations/productValidation');
const { idSchema } = require('../validations/paramValidation'); 

router.get('/myshop', verifyToken, verifySeller, productController.getSellerProducts);
router.get('/', productController.getProducts);

router.get('/:id', validate(idSchema, 'params'), productController.getProductById);

router.post('/', 
  verifyToken, 
  verifySeller,
  upload.array('images', 5),
  validate(createProductSchema), 
  productController.createProduct
);

router.put('/:id', 
  verifyToken, 
  verifySeller, 
  validate(idSchema, 'params'), 
  upload.array('images', 5), 
  validate(updateProductSchema),
  productController.updateProduct
);

router.delete('/:id', 
  verifyToken, 
  verifySeller, 
  validate(idSchema, 'params'), 
  productController.deleteProduct
);

module.exports = router;