const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

router.post('/', verifyToken, verifyAdmin, upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Không tìm thấy file tải lên' });
        }
        
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