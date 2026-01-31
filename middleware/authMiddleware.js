const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
  const token = req.header('Authorization');

  if (!token) {
    return res.status(401).json({ message: "Bạn chưa đăng nhập!" });
  }

  try {
    const actualToken = token.replace("Bearer ", "");
    
    const decoded = jwt.verify(actualToken, process.env.JWT_SECRET);
    req.user = decoded; 
    next(); 
  } catch (error) {
    res.status(400).json({ message: "Token không hợp lệ!" });
  }
};

exports.verifyAdmin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next(); 
  } else {
    res.status(403).json({ message: "Bạn không có quyền Admin!" });
  }
};