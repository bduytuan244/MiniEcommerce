const Review = require('../models/Review');
const Product = require('../models/Products');
const Order = require('../models/Order'); 

exports.addReview = async (req, res) => {
  try {
    const { rating, comment, productId } = req.body; 
    const userId = req.user.id || req.user._id;   

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }

    const hasPurchased = await Order.findOne({
        user: userId, 
        'orderItems.productId': productId, 
        status: 'Hoàn thành' 
    });

    if (!hasPurchased) {
        return res.status(403).json({ 
            message: 'Bạn phải mua và nhận hàng thành công mới được đánh giá sản phẩm này!' 
        });
    }

    const alreadyReviewed = await Review.findOne({
        user: userId,
        product: productId
    });

    if (alreadyReviewed) {
        return res.status(400).json({ 
            message: 'Bạn đã đánh giá sản phẩm này rồi! Không thể đánh giá thêm.' 
        });
    }

    const review = await Review.create({
      name: req.user.name,
      rating: Number(rating),
      comment,
      user: userId,
      product: productId
    });

    res.status(201).json({ message: 'Đánh giá thành công! Cảm ơn bạn.', review });
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