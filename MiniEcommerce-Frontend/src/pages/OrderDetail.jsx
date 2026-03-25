import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';

const OrderDetail = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/orders/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setOrder(res.data);
      } catch (error) {
        Swal.fire('Lỗi', 'Không thể tải chi tiết đơn hàng', 'error');
        navigate('/profile');
      }
    };
    fetchOrder();
  }, [id, token, navigate]);

  const handleCancelOrder = async () => {
    const result = await Swal.fire({
      title: 'Hủy đơn hàng?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Đồng ý hủy'
    });

    if (result.isConfirmed) {
      try {
        await axios.put(`http://localhost:5000/api/orders/${id}/cancel`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        Swal.fire('Thành công', 'Đơn hàng đã được hủy', 'success');
        window.location.reload();
      } catch (err) {
        Swal.fire('Lỗi', err.response?.data?.message || 'Không thể hủy đơn', 'error');
      }
    }
  };

  const openReviewPopup = async (productId, productName) => {
    const { value: formValues } = await Swal.fire({
      title: 'Đánh giá sản phẩm',
      html: `
        <p><b>${productName}</b></p>
        <select id="swal-rating" class="swal2-input">
          <option value="5">5 sao - Tuyệt vời</option>
          <option value="4">4 sao - Tốt</option>
          <option value="3">3 sao - Bình thường</option>
          <option value="2">2 sao - Tệ</option>
          <option value="1">1 sao - Rất tệ</option>
        </select>
        <textarea id="swal-comment" class="swal2-textarea" placeholder="Nhập nhận xét..."></textarea>
      `,
      preConfirm: () => ({
        rating: document.getElementById('swal-rating').value,
        comment: document.getElementById('swal-comment').value
      })
    });

    if (formValues) {
      try {
        await axios.post('http://localhost:5000/api/reviews', {
          productId, ...formValues
        }, { headers: { Authorization: `Bearer ${token}` } });
        Swal.fire('Cảm ơn!', 'Đánh giá của bạn đã được gửi', 'success');
      } catch (err) {
        Swal.fire('Thông báo', err.response?.data?.message || 'Lỗi gửi đánh giá', 'warning');
      }
    }
  };

  if (!order) return <div style={{padding: '50px', textAlign: 'center'}}>Đang tải chi tiết đơn hàng...</div>;

  return (
    <div className="container" style={{marginTop: '20px'}}>
      <div className="header">
        <Link to="/profile" className="back-btn"><i className="fa-solid fa-arrow-left"></i> Trở về</Link>
        <h2 style={{margin:0}}>Mã đơn: <span style={{color: '#ee4d2d'}}>#{order._id.slice(-6).toUpperCase()}</span></h2>
      </div>

      <div className="info-grid">
        <div className="info-box">
          <h4><i className="fa-solid fa-location-dot" style={{color: '#ee4d2d'}}></i> Địa chỉ nhận hàng</h4>
          <p><b>Người nhận:</b> {order.customerName || order.user?.name}</p>
          <p><b>Địa chỉ:</b> {order.address || order.shippingAddress?.address}</p>
        </div>
        <div className="info-box">
          <h4><i className="fa-solid fa-circle-info" style={{color: '#ee4d2d'}}></i> Thông tin đơn hàng</h4>
          <p><b>Ngày đặt:</b> {new Date(order.createdAt).toLocaleString('vi-VN')}</p>
          <p><b>Trạng thái:</b> {order.isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}</p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Sản phẩm</th>
            <th>Đơn giá</th>
            <th>Số lượng</th>
            <th style={{textAlign: 'right'}}>Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          {order.orderItems.map((item, index) => (
            <tr key={index}>
              <td>
                <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                  <img src={item.image.startsWith('http') ? item.image : `http://localhost:5000${item.image}`} width="50" alt="" />
                  <div>
                    <div>{item.name}</div>
                    {order.status === 'Hoàn thành' && (
                      <button onClick={() => openReviewPopup(item.product, item.name)} style={{fontSize:'0.7rem', color:'red', border:'1px solid red', background:'none', cursor:'pointer'}}>Đánh giá</button>
                    )}
                  </div>
                </div>
              </td>
              <td>{Number(item.price).toLocaleString('vi-VN')} đ</td>
              <td>{item.qty}</td>
              <td style={{textAlign: 'right'}}>{(item.price * item.qty).toLocaleString('vi-VN')} đ</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{marginTop:'20px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <span className={`badge ${order.status === 'Hoàn thành' ? 'status-completed' : 'status-pending'}`}>{order.status}</span>
        {order.status === 'Chờ xác nhận' && (
          <button className="btn-cancel-order" onClick={handleCancelOrder}>Hủy đơn</button>
        )}
      </div>
    </div>
  );
};

export default OrderDetail;