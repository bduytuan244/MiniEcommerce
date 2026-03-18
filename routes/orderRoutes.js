const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyToken, verifyAdmin, verifySeller } = require('../middleware/authMiddleware');

router.get('/myshop', verifyToken, verifySeller, orderController.getSellerOrders);

router.get('/myorders', verifyToken, orderController.getMyOrders); 

router.post('/', verifyToken, orderController.createOrder);
router.get('/', verifyToken, verifyAdmin, orderController.getOrders);

router.get('/:id', verifyToken, orderController.getOrderById);
router.put('/:id/status', verifyToken, verifyAdmin, orderController.updateOrderStatus);
router.put('/:id/pay', verifyToken, orderController.updateOrderToPaid);
router.put('/:id/cancel', verifyToken, orderController.cancelOrder);
module.exports = router;