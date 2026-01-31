const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// Khách đặt hàng
router.post('/', orderController.createOrder);

// Admin xem danh sách đơn
router.get('/', orderController.getOrders);

router.put('/:id/status', orderController.updateOrderStatus);

module.exports = router;