const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

const { check } = require('express-validator');
const { checkValidation } = require('../middleware/validate');

router.post('/register', [
    check('name', 'Tên không được để trống').not().isEmpty(),
    check('email', 'Email không hợp lệ').isEmail(),
    check('password', 'Mật khẩu phải có ít nhất 6 ký tự').isLength({ min: 6 })
  ], 
  checkValidation,
  authController.register
);

router.post('/login', [
    check('email', 'Vui lòng nhập đúng định dạng email').isEmail(),
    check('password', 'Mật khẩu không được để trống').exists()
  ],
  checkValidation,
  authController.login
);

router.post('/forgot-password', authController.forgotPassword);
router.put('/reset-password/:resetToken', authController.resetPassword);

module.exports = router;