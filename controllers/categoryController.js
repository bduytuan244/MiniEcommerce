const Category = require('../models/Category');

// crate
exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    const categoryExists = await Category.findOne({ name });
    if (categoryExists) {
      return res.status(400).json({ message: "Danh mục này đã tồn tại!" });
    }

    const newCategory = new Category({ name, description });
    await newCategory.save();
    
    res.status(201).json({ message: "Tạo danh mục thành công!", category: newCategory });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// Get
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// Update
exports.updateCategory = async (req, res) => {
  try {
    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true } 
    );

    if (!updatedCategory) {
      return res.status(404).json({ message: "Không tìm thấy danh mục" });
    }

    res.status(200).json({ message: "Cập nhật thành công!", category: updatedCategory });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// Delete
exports.deleteCategory = async (req, res) => {
  try {
    const deletedCategory = await Category.findByIdAndDelete(req.params.id);
    if (!deletedCategory) {
      return res.status(404).json({ message: "Không tìm thấy danh mục" });
    }
    res.status(200).json({ message: "Đã xóa danh mục!" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};