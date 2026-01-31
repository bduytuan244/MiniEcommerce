const Product = require('../models/Products');

// Import
exports.createProduct = async (req, res) => {
  try {
    const { name, price, stock, category, description, images } = req.body;

    const newProduct = new Product({
      name, 
      price, 
      stock, 
      category,
      description,
      images
    });

    // Lưu vào MongoDB
    await newProduct.save();

    res.status(201).json({ message: "Thêm sản phẩm thành công!", product: newProduct });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// Get all
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// Detail
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// Update
exports.updateProduct = async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true } 
    );
    
    if (!updatedProduct) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm để sửa" });
    }
    
    res.status(200).json({ message: "Cập nhật thành công!", product: updatedProduct });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// Delete
exports.deleteProduct = async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    
    if (!deletedProduct) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm để xóa" });
    }
    
    res.status(200).json({ message: "Đã xóa sản phẩm thành công!" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};