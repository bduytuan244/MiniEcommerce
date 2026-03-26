const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

const validate = require('../middleware/validateMiddleware');
const { categorySchema } = require('../validations/categoryValidation');

router.get('/', categoryController.getCategories);

router.post('/', verifyToken, verifyAdmin, validate(categorySchema), categoryController.createCategory);
router.put('/:id', verifyToken, verifyAdmin, validate(categorySchema), categoryController.updateCategory);
router.delete('/:id', verifyToken, verifyAdmin, categoryController.deleteCategory);

module.exports = router;