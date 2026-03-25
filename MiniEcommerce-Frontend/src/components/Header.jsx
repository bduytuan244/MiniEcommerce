import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Header = () => {
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('userInfo');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (Array.isArray(cart)) {
      const totalItems = cart.reduce((acc, item) => acc + (item.qty || 1), 0);
      setCartCount(totalItems);
    }
  }, []);

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    setUser(null);
    navigate('/login');
  };

  return (
    <header className="main-header">
      <Link to="/" className="logo">
        <i className="fa-solid fa-store"></i> Mini Shop
      </Link>

      <div className="nav-links">
        <Link to="/"><i className="fa-solid fa-house"></i> Trang chủ</Link>
        
        <Link to="/cart" className="cart-wrapper">
          <i className="fa-solid fa-cart-shopping"></i> Giỏ hàng
          <span className="cart-badge">{cartCount}</span>
        </Link>
        
        {(user?.role === 'seller' || user?.role === 'admin') ? (
          <Link to="/seller" className="link-seller-center">
            <i className="fa-solid fa-store"></i> Kênh Người Bán
          </Link>
        ) : null}

        {!user ? (
          <Link to="/login"><i className="fa-solid fa-user"></i> Đăng nhập</Link>
        ) : (
          <div className="user-menu">
            <Link to="/profile">
              <i className="fa-solid fa-circle-user"></i> <span>{user?.email || 'Tài khoản'}</span>
            </Link>
            <a href="/" onClick={handleLogout} style={{ color: '#ffccc7' }}>
              <i className="fa-solid fa-right-from-bracket"></i> Đăng xuất
            </a>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;