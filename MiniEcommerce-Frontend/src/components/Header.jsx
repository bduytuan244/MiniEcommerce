import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Header = () => {
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const navigate = useNavigate();

  // Chạy 1 lần khi load trang để kiểm tra đăng nhập và giỏ hàng
  useEffect(() => {
    // 1. Lấy thông tin user từ localStorage (nếu đã đăng nhập)
    const storedUser = localStorage.getItem('userInfo');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    // 2. Tính tổng số lượng item trong giỏ hàng
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const totalItems = cart.reduce((acc, item) => acc + (item.qty || 1), 0);
    setCartCount(totalItems);
  }, []);

  // Hàm xử lý Đăng xuất
  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    setUser(null);
    navigate('/login'); // Chuyển hướng về trang đăng nhập
  };

  return (
    <header className="main-header">
      {/* Logo */}
      <Link to="/" className="logo">
        <i className="fa-solid fa-store"></i> Mini Shop
      </Link>

      <div className="nav-links">
        <Link to="/"><i className="fa-solid fa-house"></i> Trang chủ</Link>
        
        <Link to="/cart" className="cart-wrapper">
          <i className="fa-solid fa-cart-shopping"></i> Giỏ hàng
          <span className="cart-badge">{cartCount}</span>
        </Link>
        
        {/* Nút Kênh người bán: Chỉ hiển thị nếu User đã đăng nhập VÀ có role là seller hoặc admin */}
        {user && (user.role === 'seller' || user.role === 'admin') && (
          <Link to="/seller" className="link-seller-center">
            <i className="fa-solid fa-store"></i> Kênh Người Bán
          </Link>
        )}

        {/* LOGIC ĐĂNG NHẬP / ĐĂNG XUẤT */}
        {!user ? (
          // Nếu CHƯA đăng nhập -> Hiện nút Đăng nhập
          <Link to="/login"><i className="fa-solid fa-user"></i> Đăng nhập</Link>
        ) : (
          // Nếu ĐÃ đăng nhập -> Hiện Menu User
          <div className="user-menu">
            <Link to="/profile">
              <i className="fa-solid fa-circle-user"></i> <span>{user.name || 'Tài khoản'}</span>
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