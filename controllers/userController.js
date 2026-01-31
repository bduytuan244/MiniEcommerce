const User = require('../models/User');

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// delete
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ message: "Bạn không thể tự xóa tài khoản của mình!" });
    }

    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Đã xóa người dùng thành công!" });
    
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};