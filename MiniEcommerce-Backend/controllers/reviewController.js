const Review = require('../models/Review');
const Order = require('../models/Order');
const Product = require('../models/Products');

exports.createReview = async (req, res) => {
    try {
        const { productId, rating, comment } = req.body;
        const userId = req.user._id || req.user.id;

        const hasBoughtAndCompleted = await Order.findOne({
            user: userId,
            status: 'Hoàn thành', 
            'orderItems.product': productId 
        });

        if (!hasBoughtAndCompleted) {
            return res.status(403).json({ message: "Bạn chỉ có thể đánh giá sau khi đã mua và nhận hàng thành công!" });
        }

        const alreadyReviewed = await Review.findOne({ user: userId, product: productId });
        if (alreadyReviewed) {
            return res.status(400).json({ message: "Bạn đã đánh giá sản phẩm này rồi!" });
        }

        const review = new Review({
            user: userId,
            product: productId,
            name: req.user.name || "Khách hàng", 
            rating: Number(rating),
            comment: comment
        });

        await review.save();

        const reviews = await Review.find({ product: productId });
        const numReviews = reviews.length;
        const avgRating = reviews.reduce((acc, item) => item.rating + acc, 0) / numReviews;
        
        await Product.findByIdAndUpdate(productId, { 
            rating: avgRating.toFixed(1), 
            numReviews: numReviews 
        });

        res.status(201).json({ message: "Cảm ơn bạn đã đánh giá sản phẩm!" });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getProductReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ product: req.params.productId }).sort('-createdAt');
        res.status(200).json(reviews);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};