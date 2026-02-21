const multer = require('multer');
const path = require('path');

// 1. Cấu hình nơi lưu trữ và tên file
const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, 'uploads/'); // Lưu vào thư mục uploads/
    },
    filename(req, file, cb) {
        // Đổi tên file: image-163456789.jpg
        cb(null, `image-${Date.now()}${path.extname(file.originalname)}`);
    }
});

// 2. Kiểm tra chỉ cho phép up ảnh
function checkFileType(file, cb) {
    const filetypes = /jpg|jpeg|png|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Chỉ cho phép tải lên định dạng hình ảnh (jpg, jpeg, png, webp)!'));
    }
}

// 3. Khởi tạo multer
const upload = multer({
    storage,
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
});

module.exports = upload;