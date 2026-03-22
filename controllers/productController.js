const Product = require('../models/Products');
const Review = require('../models/Review');

exports.createProduct = async (req, res) => {
  try {
    const { name, price, stock, countInStock, category, brand, description } = req.body;
    
    let imageUrls = [];
    
    if (req.files && req.files.length > 0) {
      imageUrls = req.files.map(file => file.path); 
    } 
    else if (req.body.images) {
        imageUrls = req.body.images;
    }

    if (imageUrls.length === 0) {
        return res.status(400).json({ message: "Vui lòng tải lên ít nhất 1 ảnh sản phẩm" });
    }

    const actualStock = countInStock !== undefined ? countInStock : (stock || 0);

    const newProduct = new Product({
      name, 
      price, 
      countInStock: actualStock, 
      stock: actualStock,       
      category,
      brand, 
      description,
      images: imageUrls,
      seller_id: req.user._id || req.user.id 
    });

    await newProduct.save();

    res.status(201).json({ message: "Thêm sản phẩm thành công!", product: newProduct });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const queryObj = { ...req.query };
    
    const excludedFields = ['page', 'sort', 'limit', 'fields', 'keyword'];
    excludedFields.forEach(el => delete queryObj[el]);

    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
    
    let queryConditions = JSON.parse(queryStr);
    
    if (req.query.keyword) {
        queryConditions.name = { $regex: `^${req.query.keyword}`, $options: 'i' };
    }
    
    if (req.query.brand) {
        queryConditions.brand = { $regex: `^${req.query.brand}$`, $options: 'i' };
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

exports.getSellerProducts = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const products = await Product.find({ seller_id: userId }).sort('-createdAt');
    
    res.status(200).json({ products });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

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

exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm để sửa" });
    }

    const userId = req.user._id || req.user.id;

    if (req.user.isAdmin || product.seller_id.toString() === userId.toString()) {
        
        let updateData = { ...req.body };
        
        const actualStock = req.body.countInStock !== undefined ? req.body.countInStock : req.body.stock;
        if (actualStock !== undefined) {
            updateData.countInStock = actualStock; 
            updateData.stock = actualStock; 
        }

        const updatedProduct = await Product.findByIdAndUpdate(
          req.params.id,
          updateData,
          { new: true } 
        );
        return res.status(200).json({ message: "Cập nhật thành công!", product: updatedProduct });
    } else {
        return res.status(403).json({ message: "Bạn không có quyền sửa sản phẩm của người khác!" });
    }
    
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm để xóa" });
    }

    const userId = req.user._id || req.user.id;

    if (req.user.isAdmin || product.seller_id.toString() === userId.toString()) {
        await Product.findByIdAndDelete(req.params.id);
        return res.status(200).json({ message: "Đã xóa sản phẩm thành công!" });
    } else {
        return res.status(403).json({ message: "Bạn không có quyền xóa sản phẩm của người khác!" });
    }
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};