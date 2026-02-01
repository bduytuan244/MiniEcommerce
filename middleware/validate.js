const { validationResult } = require('express-validator');

exports.checkValidation = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: "Dữ liệu không hợp lệ", 
      errors: errors.array().map(err => err.msg) 
    });
  }
  
  next();
};