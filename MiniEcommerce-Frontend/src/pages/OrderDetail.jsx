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

  const handleConfirmReceived = async () => {
    const result = await Swal.fire({
      title: 'Xác nhận đã nhận hàng?',
      text: 'Tiền sẽ được chuyển cho Người bán. Bạn sẽ không thể trả hàng sau khi xác nhận!',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Đã nhận được hàng',
      confirmButtonColor: '#28a745'
    });

    if (result.isConfirmed) {
      try {
        await axios.put(`http://localhost:5000/api/orders/${id}/status`, { status: 'Hoàn thành' }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        Swal.fire('Cảm ơn bạn!', 'Đơn hàng đã hoàn thành.', 'success');
        window.location.reload();
      } catch (err) {
        Swal.fire('Lỗi', err.response?.data?.message || 'Không thể cập nhật', 'error');
      }
    }
  };

  const handleReturnOrder = async () => {
    const result = await Swal.fire({
      title: 'Yêu cầu trả hàng/Hoàn tiền?',
      text: 'Bạn có chắc chắn muốn trả lại đơn hàng này không?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Xác nhận Trả hàng',
      confirmButtonColor: '#dc3545'
    });

    if (result.isConfirmed) {
      try {
        await axios.put(`http://localhost:5000/api/orders/${id}/status`, { status: 'Trả hàng' }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        Swal.fire('Thành công', 'Đã gửi yêu cầu Trả hàng.', 'success');
        window.location.reload();
      } catch (err) {
        Swal.fire('Lỗi', err.response?.data?.message || 'Không thể cập nhật', 'error');
      }
    }
  };

  const openReviewPopup = async (productId, productName) => {
    const { value: formValues } = await Swal.fire({
      title: 'Đánh giá sản phẩm',
      html: `
        <p style="margin-bottom: 15px; color: #555;"><b>${productName}</b></p>
        <select id="swal-rating" class="swal2-input" style="width: 80%; max-width: 100%; font-size: 16px;">
          <option value="5">⭐⭐⭐⭐⭐ - Tuyệt vời</option>
          <option value="4">⭐⭐⭐⭐ - Tốt</option>
          <option value="3">⭐⭐⭐ - Bình thường</option>
          <option value="2">⭐⭐ - Tệ</option>
          <option value="1">⭐ - Rất tệ</option>
        </select>
        <textarea id="swal-comment" class="swal2-textarea" placeholder="Nhập nhận xét của bạn về sản phẩm này..." style="width: 80%; max-width: 100%;"></textarea>
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
        Swal.fire('Cảm ơn!', 'Đánh giá của bạn đã được ghi nhận', 'success');
      } catch (err) {
        Swal.fire('Thông báo', err.response?.data?.message || 'Lỗi gửi đánh giá', 'warning');
      }
    }
  };

  if (!order) return <div style={{padding: '50px', textAlign: 'center'}}><i className="fa-solid fa-spinner fa-spin"></i> Đang tải chi tiết đơn hàng...</div>;

  const itemsSubTotal = order.orderItems.reduce((acc, item) => {
    const itemPrice = typeof item.price === 'object' ? Number(item.price.$numberDecimal) : Number(item.price);
    return acc + (itemPrice * item.qty);
  }, 0);

  const discountAmount = itemsSubTotal > order.totalPrice ? itemsSubTotal - order.totalPrice : 0;

  return (
  <div className="container" style={{maxWidth: '1000px', margin: '40px auto', padding: '0 20px', background: 'white', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)'}}>
    <div className="order-detail-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 30px', borderBottom: '1px solid #eee'}}>
      <Link to="/profile" className="back-btn" style={{textDecoration: 'none', color: '#0d6efd', fontWeight: '600'}}>
        <i className="fa-solid fa-arrow-left"></i> Trở về
      </Link>
      <h2 style={{ margin: 0 }}>
        Mã đơn: <span style={{ color: '#ee4d2d' }}>#{order._id.slice(-6).toUpperCase()}</span>
      </h2>
    </div>

    <div className="info-grid" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', padding: '30px'}}>
      <div className="info-box" style={{background: '#f8f9fa', padding: '20px', borderRadius: '8px', border: '1px solid #eee'}}>
        <h4 style={{marginTop: 0, borderBottom: '1px solid #ddd', paddingBottom: '10px'}}><i className="fa-solid fa-location-dot" style={{ color: '#ee4d2d' }}></i> Địa chỉ nhận hàng</h4>
        <p style={{marginBottom: '8px'}}><strong>Người nhận:</strong> {order.customerName || order.user?.name}</p>
        <p style={{marginBottom: '8px'}}><strong>Địa chỉ:</strong> {order.address || order.shippingAddress?.address}</p>
        <p style={{marginBottom: '0'}}><strong>Số điện thoại:</strong> {order.phone}</p>
      </div>
      <div className="info-box" style={{background: '#f8f9fa', padding: '20px', borderRadius: '8px', border: '1px solid #eee'}}>
        <h4 style={{marginTop: 0, borderBottom: '1px solid #ddd', paddingBottom: '10px'}}><i className="fa-solid fa-circle-info" style={{ color: '#ee4d2d' }}></i> Thông tin đơn hàng</h4>
        <p style={{marginBottom: '8px'}}><strong>Ngày đặt:</strong> {new Date(order.createdAt).toLocaleString('vi-VN')}</p>
        <p style={{marginBottom: '8px'}}><strong>Thanh toán:</strong> {order.isPaid ? <span style={{color: 'green', fontWeight:'bold'}}>Đã thanh toán</span> : <span style={{color: 'red', fontWeight:'bold'}}>Chưa thanh toán</span>}</p>
        <p style={{marginBottom: '0'}}><strong>Phương thức:</strong> {order.paymentMethod}</p>
      </div>
    </div>

    <div style={{padding: '0 30px 30px'}}>
        <h3 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px' }}>Sản phẩm đã mua</h3>
        <table className="order-items-table" style={{width: '100%', borderCollapse: 'collapse', marginTop: '15px'}}>
        <thead>
            <tr style={{background: '#f8f9fa', textAlign: 'left'}}>
            <th style={{padding: '12px'}}>Sản phẩm</th>
            <th style={{padding: '12px', textAlign: 'center'}}>Đơn giá</th>
            <th style={{ textAlign: 'center', padding: '12px' }}>Số lượng</th>
            <th style={{ textAlign: 'right', padding: '12px' }}>Thành tiền</th>
            </tr>
        </thead>
        <tbody>
            {order.orderItems.map((item, index) => {
                const itemPrice = typeof item.price === 'object' ? Number(item.price.$numberDecimal) : Number(item.price);
                const itemProductId = item.productId || item.product; 

                return (
                <tr key={index} style={{borderBottom: '1px solid #eee'}}>
                    <td style={{padding: '15px 12px'}}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <img 
                        src={item.image?.startsWith('http') ? item.image : `http://localhost:5000${item.image}`} 
                        width="60" height="60"
                        style={{ borderRadius: '8px', border: '1px solid #eee', objectFit: 'contain', background: 'white' }} 
                        alt="" 
                        />
                        <div>
                            <div style={{ fontWeight: '600', color: '#333' }}>{item.name}</div>
                            {order.status === 'Hoàn thành' && (
                                <button 
                                    onClick={() => openReviewPopup(itemProductId, item.name)}
                                    style={{marginTop: '8px', background: 'transparent', border: '1px solid #ee4d2d', color: '#ee4d2d', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold'}}>
                                    <i className="fa-regular fa-star"></i> Đánh giá
                                </button>
                            )}
                        </div>
                    </div>
                    </td>
                    <td style={{ textAlign: 'center', padding: '15px 12px', color: '#666' }}>{itemPrice.toLocaleString('vi-VN')} đ</td>
                    <td style={{ textAlign: 'center', padding: '15px 12px', fontWeight: 'bold' }}>{item.qty}</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold', padding: '15px 12px', color: '#333' }}>
                    {(itemPrice * item.qty).toLocaleString('vi-VN')} đ
                    </td>
                </tr>
                )
            })}
        </tbody>
        </table>

        <div style={{display: 'flex', justifyContent: 'flex-end', marginTop: '20px'}}>
            <table style={{width: '350px', fontSize: '1.05rem'}}>
                <tbody>
                    <tr>
                        <td style={{padding: '8px 0', color: '#666'}}>Tổng tiền hàng:</td>
                        <td style={{padding: '8px 0', textAlign: 'right', fontWeight: 'bold'}}>{itemsSubTotal.toLocaleString('vi-VN')} đ</td>
                    </tr>
                    {discountAmount > 0 && (
                        <tr>
                            <td style={{padding: '8px 0', color: '#28a745'}}><i className="fa-solid fa-ticket"></i> Voucher giảm giá:</td>
                            <td style={{padding: '8px 0', textAlign: 'right', fontWeight: 'bold', color: '#28a745'}}>- {discountAmount.toLocaleString('vi-VN')} đ</td>
                        </tr>
                    )}
                    <tr style={{borderTop: '2px solid #eee'}}>
                        <td style={{padding: '15px 0 0 0', fontWeight: 'bold', fontSize: '1.2rem'}}>Thành tiền:</td>
                        <td style={{padding: '15px 0 0 0', textAlign: 'right', fontWeight: 'bold', fontSize: '1.4rem', color: '#ee4d2d'}}>{Number(order.totalPrice).toLocaleString('vi-VN')} đ</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fafafa', padding: '20px', borderRadius: '8px', border: '1px solid #eee' }}>
            <div>
                <span style={{ fontWeight: '600', marginRight: '10px' }}>Trạng thái đơn hàng:</span>
                <span className="badge" style={{
                    background: order.status === 'Hoàn thành' ? '#d4edda' : (order.status === 'Đã hủy' || order.status === 'Trả hàng') ? '#f8d7da' : '#cce5ff',
                    color: order.status === 'Hoàn thành' ? '#155724' : (order.status === 'Đã hủy' || order.status === 'Trả hàng') ? '#721c24' : '#004085',
                    padding: '8px 15px', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.9rem'
                }}>
                {order.status}
                </span>
            </div>
        
            <div style={{display: 'flex', gap: '10px'}}>
                {order.status === 'Chờ xác nhận' && (
                    <button className="btn-cancel-order" onClick={handleCancelOrder} style={{background: 'white', color: '#dc3545', border: '1px solid #dc3545', padding: '10px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer'}}>
                        Hủy đơn hàng
                    </button>
                )}

                {(order.status === 'Đang vận chuyển' || order.status === 'Hoàn thành') && (
                    <button onClick={handleReturnOrder} style={{background: 'white', color: '#dc3545', border: '1px solid #dc3545', padding: '10px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer'}}>
                        Yêu cầu Trả hàng
                    </button>
                )}

                {order.status === 'Đang vận chuyển' && (
                    <button onClick={handleConfirmReceived} style={{background: '#28a745', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer'}}>
                        Đã nhận được hàng
                    </button>
                )}
            </div>
        </div>
    </div>
  </div>
  );
};

export default OrderDetail;