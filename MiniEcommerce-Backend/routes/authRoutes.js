const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');
const { registerSchema, loginSchema } = require('../validations/authValidation');

router.post('/register', validate(registerSchema), authController.register);

router.post('/verify-otp', authController.verifyAccount);

router.post('/login', validate(loginSchema), authController.login);

router.post('/forgot-password', authController.forgotPassword);

router.put('/reset-password/:resetToken', authController.resetPassword);

router.post('/refresh', authController.refreshToken);
router.post('/logout', verifyToken, authController.logout);

module.exports = router;