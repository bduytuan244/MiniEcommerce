const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

const validate = require('../middleware/validateMiddleware');
const { idSchema } = require('../validations/paramValidation');

router.post('/apply', verifyToken, couponController.applyCoupon);
router.post('/', verifyToken, verifyAdmin, couponController.createCoupon);
router.get('/', verifyToken, verifyAdmin, couponController.getCoupons);

router.delete('/:id', verifyToken, verifyAdmin, validate(idSchema, 'params'), couponController.deleteCoupon);

module.exports = router;