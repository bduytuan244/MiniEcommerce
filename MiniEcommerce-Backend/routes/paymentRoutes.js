const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { verifyToken } = require('../middleware/authMiddleware'); 

const validate = require('../middleware/validateMiddleware');
const { idSchema } = require('../validations/paramValidation');

router.post('/create_payment_url/:id', verifyToken, validate(idSchema, 'params'), paymentController.createPaymentUrl);

router.get('/vnpay_return', paymentController.vnpayReturn);

module.exports = router;