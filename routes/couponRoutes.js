const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

router.post('/', verifyToken, verifyAdmin, couponController.createCoupon); 
router.post('/apply', couponController.applyCoupon); 

module.exports = router;