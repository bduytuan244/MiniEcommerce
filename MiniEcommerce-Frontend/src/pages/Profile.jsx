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

  const handleRequestSeller = async () => {
    try {
      const res = await axios.post('http://localhost:5000/api/users/request-seller', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      Swal.fire('Thành công', res.data.message || 'Đã gửi yêu cầu!', 'success');
      
      const updatedUser = { ...user, sellerStatus: 'pending' };
      setUser(updatedUser);
      localStorage.setItem('userInfo', JSON.stringify(updatedUser));
      
    } catch (error) {
      Swal.fire('Lỗi', error.response?.data?.message || 'Có lỗi xảy ra', 'error');
    }
  };

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
      case 'Hoàn thành': return <span className="badge badge-delivered" style={{color: '#155724', background: '#d4edda', padding: '5px 10px', borderRadius: '15px', fontSize: '0.85rem'}}>Hoàn thành</span>;
      case 'Đã hủy': return <span className="badge badge-cancelled" style={{color: '#721c24', background: '#f8d7da', padding: '5px 10px', borderRadius: '15px', fontSize: '0.85rem'}}>Đã hủy</span>;
      case 'Đang vận chuyển': return <span className="badge badge-shipping" style={{color: '#004085', background: '#cce5ff', padding: '5px 10px', borderRadius: '15px', fontSize: '0.85rem'}}>Đang vận chuyển</span>;
      default: return <span className="badge badge-pending" style={{color: '#856404', background: '#fff3cd', padding: '5px 10px', borderRadius: '15px', fontSize: '0.85rem'}}>{status || 'Chờ xác nhận'}</span>;
    }
  };

  return (
    <div className="profile-container" style={{maxWidth: '1000px', margin: '40px auto', padding: '0 20px', display: 'flex', gap: '30px', alignItems: 'flex-start'}}>
      
      <div className="user-info" style={{flex: '1', background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', textAlign: 'center'}}>
        <div className="avatar" style={{fontSize: '4rem', color: '#ee4d2d', marginBottom: '15px'}}><i className="fa-solid fa-circle-user"></i></div>
        <h3 style={{margin: '0 0 10px 0'}}>{user?.name || 'Người dùng'}</h3>
        <p style={{color: '#666', margin: '0 0 20px 0'}}>{user?.email}</p>
        
        {!user?.isAdmin && !user?.isSeller && (
            <div style={{marginBottom: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px', border: '1px dashed #ddd'}}>
                {user?.sellerStatus === 'pending' ? (
                    <span style={{color: '#856404', fontWeight: '600'}}><i className="fa-solid fa-clock"></i> Đang chờ Admin duyệt Shop</span>
                ) : (
                    <>
                        <p style={{fontSize: '0.9rem', color: '#555', margin: '0 0 10px 0'}}>Bạn muốn mở gian hàng?</p>
                        <button onClick={handleRequestSeller} style={{background: '#28a745', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', width: '100%'}}>
                            <i className="fa-solid fa-shop"></i> Đăng ký làm Người Bán
                        </button>
                    </>
                )}
            </div>
        )}

        {user?.isSeller && !user?.isAdmin && (
            <div style={{marginBottom: '20px', padding: '10px', background: '#e6f4ea', color: '#1e7e34', borderRadius: '8px', fontWeight: 'bold'}}>
                <i className="fa-solid fa-check-circle"></i> Tài khoản Người Bán
            </div>
        )}

        <button className="btn-logout" onClick={confirmLogout} style={{background: '#dc3545', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', width: '100%'}}>
            <i className="fa-solid fa-right-from-bracket"></i> Đăng xuất
        </button>
      </div>
      
      <div className="order-history" style={{flex: '2.5', background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)'}}>
        <h3 style={{marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '15px'}}><i className="fa-solid fa-box-open" style={{ color: '#ee4d2d', marginRight: '8px' }}></i>Đơn hàng của tôi</h3>
        <table style={{width: '100%', borderCollapse: 'collapse', marginTop: '15px'}}>
          <thead>
            <tr style={{background: '#f8f9fa', textAlign: 'left'}}>
              <th style={{padding: '12px'}}>Mã đơn</th>
              <th style={{padding: '12px'}}>Ngày đặt</th>
              <th style={{padding: '12px'}}>Tổng tiền</th>
              <th style={{ textAlign: 'center', padding: '12px' }}>Trạng thái</th>
              <th style={{ textAlign: 'center', padding: '12px' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{textAlign:'center', padding: '20px'}}>Đang tải...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan="5" style={{textAlign:'center', padding: '20px', color: '#888'}}>Bạn chưa có đơn hàng nào.</td></tr>
            ) : (
              orders.map(order => (
                <tr key={order._id} style={{borderBottom: '1px solid #eee'}}>
                  <td style={{padding: '15px 12px', fontWeight: 'bold', color: '#0d6efd'}}>#{order._id.slice(-6).toUpperCase()}</td>
                  <td style={{padding: '15px 12px'}}>{new Date(order.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td style={{padding: '15px 12px', color: '#ee4d2d', fontWeight: 'bold'}}>{Number(order.totalPrice).toLocaleString('vi-VN')} đ</td>
                  <td style={{ textAlign: 'center', padding: '15px 12px' }}>{getStatusBadge(order.status)}</td>
                  <td style={{ textAlign: 'center', padding: '15px 12px' }}>
                    <Link to={`/order/${order._id}`} style={{background: '#f0f8ff', color: '#0d6efd', padding: '6px 12px', borderRadius: '4px', textDecoration: 'none', fontWeight: 'bold'}}>Chi tiết</Link>
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