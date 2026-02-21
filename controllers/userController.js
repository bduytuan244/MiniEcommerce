const User = require('../models/User');

// Get
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

// Update
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User không tồn tại" });
    }

    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.phone = req.body.phone || user.phone;
    user.address = req.body.address || user.address;

    if (req.body.isAdmin !== undefined) {
      user.isAdmin = req.body.isAdmin;
    }

    const updatedUser = await user.save();

    res.json({ 
      message: "Cập nhật User thành công!", 
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        isAdmin: updatedUser.isAdmin
      }
    });

  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy danh sách: " + error.message });
  }
};

exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });
        
        if (user.isAdmin) {
            return res.status(400).json({ message: "Không thể xóa tài khoản Quản trị viên!" });
        }

        await User.findByIdAndDelete(req.params.id);
        res.json({ message: "Đã xóa tài khoản thành công" });
    } catch (error) {
        res.status(500).json({ message: "Lỗi server: " + error.message });
    }
};

exports.toggleLockUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

        if (user.isAdmin) {
            return res.status(400).json({ message: "Không thể khóa tài khoản Quản trị viên!" });
        }

        user.isLocked = !user.isLocked;
        await user.save();

        res.json({ 
            message: user.isLocked ? "Đã khóa tài khoản!" : "Đã mở khóa tài khoản!", 
            isLocked: user.isLocked 
        });
    } catch (error) {
        res.status(500).json({ message: "Lỗi server: " + error.message });
    }
};