const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

router.post('/', verifyToken, orderController.createOrder);

router.get('/my-orders', verifyToken, orderController.getMyOrders);

router.get('/', verifyToken, verifyAdmin, orderController.getOrders);

router.put('/:id/status', verifyToken, verifyAdmin, orderController.updateOrderStatus);

module.exports = router;