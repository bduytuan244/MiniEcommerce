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

  if (loading) return <div style={{textAlign: 'center', padding: '50px'}}><i className="fa-solid fa-spinner fa-spin"></i> Đang tải thông tin...</div>;
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

  const actualStock = Number(product.countInStock ?? product.stock ?? 0);

  const imgSrc = product.images && product.images.length > 0 
      ? (product.images[0].startsWith('http') ? product.images[0] : `http://localhost:5000${product.images[0]}`)
      : 'https://via.placeholder.com/400';

  const safeReviews = Array.isArray(product.reviews) ? product.reviews : [];

  return (
    <>
      <div className="breadcrumb" style={{padding: '20px 0'}}>
        <Link to="/" style={{color: '#0d6efd', textDecoration: 'none'}}>Trang chủ</Link> <i className="fa-solid fa-angle-right" style={{ fontSize: '0.8em', margin: '0 10px', color: '#888' }}></i> <span style={{color: '#666'}}>Chi tiết sản phẩm</span>
      </div>

      <div className="detail-container" style={{display: 'flex', gap: '40px', background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)'}}>
        <div className="left-column" style={{flex: '1', textAlign: 'center'}}>
          <img 
            src={imgSrc} 
            alt={safeName} 
            style={{maxWidth: '100%', borderRadius: '8px', border: '1px solid #eee', objectFit: 'contain', maxHeight: '400px'}}
          />
        </div>
        
        <div className="right-column" style={{flex: '1.5'}}>
          <h1 className="product-title" style={{marginTop: 0, fontSize: '1.8rem', color: '#333'}}>{safeName}</h1>
          
          <div className="product-meta" style={{marginBottom: '20px', color: '#666'}}>
            <span style={{marginRight: '15px'}}>Danh mục: <strong style={{color: '#0d6efd'}}>{safeCategory}</strong></span>
            <span style={{marginRight: '15px'}}>|</span>
            <span>Kho: <strong style={{color: actualStock > 0 ? '#198754' : '#dc3545'}}>{actualStock > 0 ? actualStock : 'Hết hàng'}</strong></span>
          </div>
          
          <div className="price-box" style={{background: '#fafafa', padding: '15px 20px', borderRadius: '8px', marginBottom: '25px', border: '1px solid #eee'}}>
            <p className="product-price" style={{fontSize: '2rem', fontWeight: 'bold', color: '#ee4d2d', margin: 0}}>{safePrice ? Number(safePrice).toLocaleString('vi-VN') : '0'} đ</p>
          </div>
          
          <div style={{marginBottom: '30px', lineHeight: '1.6', color: '#444'}}>
            <p>{safeDesc || 'Chưa có mô tả cho sản phẩm này.'}</p>
          </div>

          <div className="action-box">
            <button 
                className="btn-buy" 
                onClick={handleAddToCart}
                disabled={actualStock <= 0}
                style={{ 
                    background: actualStock <= 0 ? '#ccc' : '#ee4d2d', 
                    color: 'white',
                    border: 'none',
                    padding: '15px 30px',
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    borderRadius: '8px',
                    cursor: actualStock <= 0 ? 'not-allowed' : 'pointer',
                    transition: '0.2s',
                    width: '100%',
                    maxWidth: '300px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px'
                }}
            >
              <i className="fa-solid fa-cart-plus"></i> {actualStock <= 0 ? 'TẠM HẾT HÀNG' : 'THÊM VÀO GIỎ HÀNG'}
            </button>
          </div>
        </div>
      </div>

      <div className="review-section" style={{background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginTop: '30px'}}>
        <h2 style={{borderBottom: '2px solid #eee', paddingBottom: '10px'}}>Khách hàng đánh giá</h2>
        <div id="review-list" style={{marginTop: '20px'}}>
          {safeReviews.length > 0 ? (
            safeReviews.map((review, index) => {
              const safeComment = typeof review.comment === 'object' ? JSON.stringify(review.comment) : review.comment;
              const reviewerName = review.name || (review.user && review.user.name) || 'Khách hàng ẩn danh';

              return (
                <div key={review._id || index} style={{ borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '15px' }}>
                  <p style={{ fontWeight: 'bold', margin: '0 0 5px', color: '#333' }}>
                    <i className="fa-solid fa-user-circle" style={{color: '#888', marginRight: '5px'}}></i> {reviewerName}
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
            <p style={{ textAlign: 'center', color: '#888', padding: '20px' }}><i className="fa-regular fa-comment-dots" style={{fontSize: '2rem', display: 'block', marginBottom: '10px'}}></i>Chưa có đánh giá nào cho sản phẩm này.</p>
          )}
        </div>
      </div>
    </>
  );
};

export default ProductDetail;