const Review = require('../models/Review');
const Product = require('../models/Products');

exports.addReview = async (req, res) => {
  try {
    const { rating, comment, productId } = req.body; 

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }

    const review = await Review.create({
      name: req.user.name,
      rating: Number(rating),
      comment,
      user: req.user._id,
      product: productId
    });

    res.status(201).json({ message: 'Đánh giá thành công!', review });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi Server: ' + error.message });
  }
};

exports.getProductReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId })
                            .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi tải đánh giá' });
  }
};