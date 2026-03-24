const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { verifyToken } = require('../middleware/authMiddleware'); 

router.post('/create_payment_url/:id', verifyToken, paymentController.createPaymentUrl);

router.get('/vnpay_return', paymentController.vnpayReturn);

module.exports = router;