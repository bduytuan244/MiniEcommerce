const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Không tìm thấy Token, vui lòng đăng nhập!' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; 
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
    }
};

const verifyAdmin = (req, res, next) => {
    if (req.user && req.user.isAdmin) {
        next(); 
    } else {
        res.status(403).json({ message: 'Bạn không có quyền truy cập Admin!' });
    }
};

module.exports = { verifyToken, verifyAdmin };