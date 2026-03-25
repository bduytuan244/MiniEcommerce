import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';

const Profile = () => {
  const [orders, setOrders] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    setUser(userInfo);

    const fetchOrders = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/orders/myorders', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setOrders(res.data);
      } catch (error) {
        console.error("Lỗi tải đơn hàng:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [token, navigate]);

  const confirmLogout = () => {
    Swal.fire({
      title: 'Đăng xuất?',
      text: "Bạn sẽ phải đăng nhập lại để mua hàng!",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      confirmButtonText: 'Đăng xuất ngay'
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.clear();
        window.location.href = '/';
      }
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Hoàn thành': return <span className="badge badge-delivered">Hoàn thành</span>;
      case 'Đã hủy': return <span className="badge badge-cancelled">Đã hủy</span>;
      case 'Đang vận chuyển': return <span className="badge badge-shipping">Đang vận chuyển</span>;
      default: return <span className="badge badge-pending">Chờ xác nhận</span>;
    }
  };

  return (
    <div className="profile-container">
      <div className="user-info">
        <div className="avatar"><i className="fa-solid fa-user"></i></div>
        <h3>{user?.name || 'Người dùng'}</h3>
        <p>{user?.email}</p>
        <button className="btn-logout" onClick={confirmLogout}>
            <i className="fa-solid fa-right-from-bracket"></i> Đăng xuất
        </button>
      </div>
      

      <div className="order-history">
        <h3><i className="fa-solid fa-box-open" style={{ color: '#ee4d2d', marginRight: '8px' }}></i>Đơn hàng của tôi</h3>
        <table>
          <thead>
            <tr>
              <th>Mã đơn</th>
              <th>Ngày đặt</th>
              <th>Tổng tiền</th>
              <th style={{ textAlign: 'center' }}>Trạng thái</th>
              <th style={{ textAlign: 'center' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{textAlign:'center'}}>Đang tải...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan="5" style={{textAlign:'center'}}>Bạn chưa có đơn hàng nào.</td></tr>
            ) : (
              orders.map(order => (
                <tr key={order._id}>
                  <td className="order-id">#{order._id.slice(-6).toUpperCase()}</td>
                  <td>{new Date(order.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td className="order-total">{Number(order.totalPrice).toLocaleString('vi-VN')} đ</td>
                  <td style={{ textAlign: 'center' }}>{getStatusBadge(order.status)}</td>
                  <td style={{ textAlign: 'center' }}>
                    <Link to={`/order/${order._id}`} className="btn-view">Chi tiết</Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Profile;