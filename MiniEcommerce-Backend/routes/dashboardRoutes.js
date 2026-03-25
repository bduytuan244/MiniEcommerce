const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

router.get('/stats', verifyToken, verifyAdmin, dashboardController.getDashboardStats);

module.exports = router;