const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

const validate = require('../middleware/validateMiddleware');
const { idSchema } = require('../validations/paramValidation');

router.post('/request-seller', verifyToken, userController.requestSeller);
router.get('/seller-requests', verifyToken, verifyAdmin, userController.getSellerRequests);

router.put('/seller-requests/:id', verifyToken, verifyAdmin, validate(idSchema, 'params'), userController.handleSellerRequest);
router.get('/', verifyToken, verifyAdmin, userController.getUsers);
router.put('/:id/lock', verifyToken, verifyAdmin, validate(idSchema, 'params'), userController.toggleLockUser);
router.put('/:id', verifyToken, verifyAdmin, validate(idSchema, 'params'), userController.updateUser);
router.delete('/:id', verifyToken, verifyAdmin, validate(idSchema, 'params'), userController.deleteUser);

module.exports = router;