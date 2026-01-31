const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

router.get('/', verifyToken, verifyAdmin, userController.getUsers);
router.delete('/:id', verifyToken, verifyAdmin, userController.deleteUser);

module.exports = router;