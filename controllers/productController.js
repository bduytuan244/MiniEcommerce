const Product = require('../models/Products');

// Create
exports.createProduct = async (req, res) => {
  try {
    const { name, price, stock, category, description, images, brand } = req.body;

    const newProduct = new Product({
      name, 
      price, 
      stock, 
      category,
      brand,
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

// 2. Get
exports.getProducts = async (req, res) => {
  try {
    const queryObj = { ...req.query };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach(el => delete queryObj[el]);

    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
    
    let queryConditions = JSON.parse(queryStr);
    if (req.query.keyword) {
        queryConditions.name = { $regex: req.query.keyword, $options: 'i' };
        delete queryConditions.keyword; 
    }
    
    if (req.query.brand) {
        queryConditions.brand = req.query.brand;
    }

    let query = Product.find(queryConditions);

    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt'); 
    }

    if (req.query.fields) {
      const fields = req.query.fields.split(',').join(' ');
      query = query.select(fields);
    } else {
      query = query.select('-__v'); 
    }

    const page = req.query.page * 1 || 1; 
    const limit = req.query.limit * 1 || 10; 
    const skip = (page - 1) * limit;

    query = query.skip(skip).limit(limit);

    const products = await query;
    const total = await Product.countDocuments(queryConditions); 

    res.status(200).json({
      status: 'success',
      count: products.length,
      totalProducts: total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      products
    });

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