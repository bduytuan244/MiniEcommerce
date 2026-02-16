const jwt = require('jsonwebtoken');
const User = require('../models/User'); 

const verifyToken = async (req, res, next) => { 
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({ message: 'Không tìm thấy người dùng trong hệ thống' });
            }

            next(); 
        } catch (error) {
            console.error("Lỗi xác thực:", error.message);
            res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
        }
    } else {
        res.status(401).json({ message: 'Không tìm thấy Token xác thực' });
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