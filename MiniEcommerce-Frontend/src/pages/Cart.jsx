import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
    setCartItems(storedCart);
  }, []);

  const handleQtyChange = (id, newQty) => {
    if (newQty < 1) return; 
    
    const updatedCart = cartItems.map(item => 
      item._id === id ? { ...item, qty: Number(newQty) } : item
    );
    
    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    window.dispatchEvent(new Event('storage'));
  };

  const handleRemoveItem = (id) => {
    Swal.fire({
      title: 'Bạn có chắc chắn?',
      text: "Sản phẩm sẽ bị xóa khỏi giỏ hàng!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Xóa ngay',
      cancelButtonText: 'Hủy'
    }).then((result) => {
      if (result.isConfirmed) {
        const updatedCart = cartItems.filter(item => item._id !== id);
        setCartItems(updatedCart);
        localStorage.setItem('cart', JSON.stringify(updatedCart));
        window.dispatchEvent(new Event('storage')); 
      }
    });
  };

  const calculateTotal = () => {
    return cartItems.reduce((acc, item) => {
      const price = typeof item.price === 'object' && item.price?.$numberDecimal 
        ? Number(item.price.$numberDecimal) 
        : Number(item.price || 0);
      return acc + (price * item.qty);
    }, 0);
  };

  if (cartItems.length === 0) {
    return (
      <div className="cart-container empty-cart">
        <i className="fa-solid fa-cart-arrow-down"></i>
        <h2>Giỏ hàng của bạn đang trống</h2>
        <p>Hãy tìm thêm những sản phẩm tuyệt vời nhé!</p>
        <Link to="/" className="btn-continue">Tiếp tục mua sắm</Link>
      </div>
    );
  }

  return (
    <>
      <div className="breadcrumb">
        <Link to="/">Trang chủ</Link> <i className="fa-solid fa-angle-right" style={{ fontSize: '0.8em', margin: '0 5px' }}></i> Giỏ hàng của bạn
      </div>

      <div className="cart-container">
        <h2 className="cart-title">
          <i className="fa-solid fa-cart-shopping" style={{ color: '#ee4d2d', marginRight: '10px' }}></i>
          Giỏ hàng của bạn
        </h2>
        
        <table className="cart-table">
          <thead>
            <tr>
              <th>Sản phẩm</th>
              <th>Đơn giá</th>
              <th style={{ textAlign: 'center' }}>Số lượng</th>
              <th>Thành tiền</th>
              <th style={{ textAlign: 'center' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {cartItems.map((item) => {
              const safePrice = typeof item.price === 'object' && item.price?.$numberDecimal 
                ? Number(item.price.$numberDecimal) 
                : Number(item.price || 0);
              
              const safeName = typeof item.name === 'object' ? JSON.stringify(item.name) : item.name;

              // FIX LỖI ĐƯỜNG DẪN ẢNH CHUẨN XÁC
              const imgSrc = item.images && item.images.length > 0 
                ? (item.images[0].startsWith('http') ? item.images[0] : `http://localhost:5000${item.images[0]}`)
                : 'https://via.placeholder.com/80';

              return (
                <tr key={item._id}>
                  <td>
                    <div className="product-col">
                      <img 
                        src={imgSrc} 
                        alt={safeName} 
                        className="cart-img"
                      />
                      <span className="product-name">{safeName}</span>
                    </div>
                  </td>
                  
                  <td className="item-price">
                    {safePrice.toLocaleString('vi-VN')} đ
                  </td>
                  
                  <td style={{ textAlign: 'center' }}>
                    <input 
                      type="number" 
                      className="qty-input" 
                      value={item.qty} 
                      min="1"
                      onChange={(e) => handleQtyChange(item._id, e.target.value)}
                    />
                  </td>
                  
                  <td className="item-subtotal">
                    {(safePrice * item.qty).toLocaleString('vi-VN')} đ
                  </td>
                  
                  <td style={{ textAlign: 'center' }}>
                    <button className="btn-remove" onClick={() => handleRemoveItem(item._id)}>
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="cart-footer">
          <div className="cart-summary">
            Tổng thanh toán: <span id="total-price">{calculateTotal().toLocaleString('vi-VN')} đ</span>
          </div>
          
          <button className="btn-checkout" onClick={() => navigate('/checkout')}>
            Tiến hành đặt hàng <i className="fa-solid fa-arrow-right"></i>
          </button>
        </div>
      </div>
    </>
  );
};

export default Cart;