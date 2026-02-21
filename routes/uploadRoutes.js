const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

// API Upload 1 ảnh (Chỉ Admin mới được upload)
router.post('/', verifyToken, verifyAdmin, upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Không tìm thấy file tải lên' });
        }
        
        // Trả về đường dẫn ảnh để Frontend lưu vào Database
        // Dùng replace để đổi dấu \ thành / (để sửa lỗi đường dẫn trên Windows)
        const imageUrl = `/${req.file.path.replace(/\\/g, '/')}`;
        
        res.status(200).json({ 
            message: 'Tải ảnh thành công', 
            imageUrl: imageUrl 
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;