import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/products/${id}`);
        const data = res.data?.data || res.data?.product || res.data;
        setProduct(data);
        setLoading(false);
      } catch (error) {
        console.error("Lỗi lấy dữ liệu:", error);
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existingItemIndex = cart.findIndex(item => item._id === product._id);
    
    if (existingItemIndex !== -1) {
      cart[existingItemIndex].qty += 1;
    } else {
      cart.push({ ...product, qty: 1 });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    
    Swal.fire({
      icon: 'success',
      title: 'Đã thêm vào giỏ hàng!',
      showConfirmButton: false,
      timer: 1500
    }).then(() => {
      window.location.reload(); 
    });
  };

  if (loading) return <div style={{textAlign: 'center', padding: '50px'}}>Đang tải thông tin...</div>;
  if (!product) return <div style={{textAlign: 'center', padding: '50px'}}>Không tìm thấy sản phẩm!</div>;

  const safePrice = typeof product.price === 'object' && product.price?.$numberDecimal ? product.price.$numberDecimal : product.price;
  const safeName = typeof product.name === 'object' ? JSON.stringify(product.name) : product.name;
  const safeDesc = typeof product.description === 'object' ? JSON.stringify(product.description) : product.description;
  
  let safeCategory = 'Chưa cập nhật';
  if (product.category) {
      if (typeof product.category === 'object') {
          safeCategory = product.category.name || JSON.stringify(product.category);
      } else {
          safeCategory = product.category;
      }
  }

  const safeReviews = Array.isArray(product.reviews) ? product.reviews : [];

  return (
    <>
      <div className="breadcrumb">
        <Link to="/">Trang chủ</Link> <i className="fa-solid fa-angle-right" style={{ fontSize: '0.8em', margin: '0 5px' }}></i> Chi tiết sản phẩm
      </div>

      <div className="detail-container">
        <div className="left-column">
          <img 
            src={product.images && product.images.length > 0 ? `http://localhost:5000${product.images[0]}` : 'https://via.placeholder.com/400'} 
            alt={safeName} 
          />
        </div>
        
        <div className="right-column">
          <h1 className="product-title">{safeName}</h1>
          
          <div className="product-meta">
            <span>Danh mục: {safeCategory}</span>
            <span>|</span>
            <span>Kho: {product.countInStock > 0 ? product.countInStock : 'Hết hàng'}</span>
          </div>
          
          <div className="price-box">
            <p className="product-price">{safePrice ? Number(safePrice).toLocaleString('vi-VN') : '0'} đ</p>
          </div>
          
          <div style={{marginBottom: '20px'}}>
            <p>{safeDesc || 'Chưa có mô tả cho sản phẩm này.'}</p>
          </div>

          <div className="action-box">
            <button 
                className="btn-buy" 
                onClick={handleAddToCart}
                disabled={product.countInStock === 0}
                style={{ background: product.countInStock === 0 ? '#ccc' : '#ee4d2d' }}
            >
              <i className="fa-solid fa-cart-plus"></i> Thêm vào giỏ hàng
            </button>
          </div>
        </div>
      </div>

      <div className="review-section">
        <h2>Khách hàng đánh giá</h2>
        <div id="review-list">
          {safeReviews.length > 0 ? (
            safeReviews.map((review, index) => {
              const safeComment = typeof review.comment === 'object' ? JSON.stringify(review.comment) : review.comment;
              const reviewerName = review.name || (review.user && review.user.name) || 'Khách hàng ẩn danh';

              return (
                <div key={review._id || index} style={{ borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '15px' }}>
                  <p style={{ fontWeight: 'bold', margin: '0 0 5px', color: '#333' }}>
                    <i className="fa-solid fa-user-circle"></i> {reviewerName}
                  </p>
                  
                  <p style={{ color: '#ffce3d', margin: '0 0 10px', fontSize: '0.9rem' }}>
                    {Array.from({ length: review.rating || 5 }).map((_, i) => (
                      <i key={i} className="fa-solid fa-star"></i>
                    ))}
                  </p>
                  
                  <p style={{ margin: 0, color: '#555', lineHeight: '1.5' }}>{safeComment}</p>
                </div>
              );
            })
          ) : (
            <p style={{ textAlign: 'center', color: '#666' }}>Chưa có đánh giá nào cho sản phẩm này.</p>
          )}
        </div>
      </div>
    </>
  );
};

export default ProductDetail;