const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

router.post('/request-seller', verifyToken, userController.requestSeller);

router.get('/seller-requests', verifyToken, verifyAdmin, userController.getSellerRequests);


router.put('/seller-requests/:id', verifyToken, verifyAdmin, userController.handleSellerRequest);

router.get('/', verifyToken, verifyAdmin, userController.getUsers);

router.put('/:id/lock', verifyToken, verifyAdmin, userController.toggleLockUser);

router.put('/:id', verifyToken, verifyAdmin, userController.updateUser);

router.delete('/:id', verifyToken, verifyAdmin, userController.deleteUser);

module.exports = router;