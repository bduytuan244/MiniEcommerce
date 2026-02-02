const Review = require('../models/Review');
const Order = require('../models/Order');

exports.addReview = async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;
    
    
    const newReview = new Review({
      user: req.user.id,
      product: productId,
      rating,
      comment
    });

    await newReview.save();
    res.status(201).json({ message: "Đã gửi đánh giá!", review: newReview });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server (Có thể bạn đã review rồi)", error: error.message });
  }
};

exports.getProductReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId }).populate('user', 'name');
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};