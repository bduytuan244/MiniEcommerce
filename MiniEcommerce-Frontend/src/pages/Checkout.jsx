import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';

const Checkout = () => {
    const [cartItems, setCartItems] = useState([]);
    const [shippingInfo, setShippingInfo] = useState({
        name: '', phone: '', address: '', paymentMethod: 'COD'
    });
    
    const [couponCode, setCouponCode] = useState('');
    const [discount, setDiscount] = useState(0); 
    
    const navigate = useNavigate();

    useEffect(() => {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        if (cart.length === 0) {
            navigate('/cart');
            return;
        }
        setCartItems(cart);
        
        const user = JSON.parse(localStorage.getItem('userInfo'));
        if (user) setShippingInfo(prev => ({ ...prev, name: user.name }));
    }, [navigate]);

    const calculateSubTotal = () => {
        return cartItems.reduce((acc, item) => {
            const price = typeof item.price === 'object' && item.price?.$numberDecimal 
                ? Number(item.price.$numberDecimal) 
                : Number(item.price || 0);
            return acc + (price * item.qty);
        }, 0);
    };

    const subTotal = calculateSubTotal();
    const finalTotal = subTotal - discount; 

    const handleApplyCoupon = () => {
        if (couponCode.toUpperCase() === 'SALE10') {
            const discountValue = subTotal * 0.1; 
            setDiscount(discountValue);
            Swal.fire('Thành công', 'Đã áp dụng mã giảm giá 10%!', 'success');
        } else if (couponCode.trim() === '') {
             setDiscount(0);
        } else {
            Swal.fire('Lỗi', 'Mã giảm giá không hợp lệ hoặc đã hết hạn!', 'error');
            setDiscount(0);
        }
    };

    const handlePlaceOrder = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        if (!token) {
            Swal.fire('Yêu cầu', 'Đăng nhập để đặt hàng', 'warning');
            navigate('/login');
            return;
        }

        try {
            const orderData = {
                orderItems: cartItems.map(item => ({
                    product: item._id || item.product, 
                    name: item.name,
                    qty: item.qty,
                    image: item.images?.[0] || item.image,
                    price: typeof item.price === 'object' ? Number(item.price.$numberDecimal) : item.price
                })),
                
                shippingInfo: { 
                    address: shippingInfo.address, 
                    phone: shippingInfo.phone,
                    fullName: shippingInfo.name 
                },
                
                paymentMethod: shippingInfo.paymentMethod,
                totalPrice: finalTotal
            }; 

            const res = await axios.post('http://localhost:5000/api/orders', orderData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.status === 201) {
                localStorage.removeItem('cart');
                window.dispatchEvent(new Event('storage')); 
                Swal.fire('Thành công', 'Đơn hàng đã được ghi nhận!', 'success').then(() => {
                    navigate(`/order/${res.data._id}`); 
                });
            }
        } catch (error) { 
            console.error("Lỗi đặt hàng:", error);
            Swal.fire('Lỗi', error.response?.data?.message || 'Không thể đặt hàng', 'error');
        }
    };

    return (
        <div className="checkout-container">
            <div className="checkout-form">
                <h2><i className="fa-solid fa-map-location-dot" style={{color: '#ee4d2d', marginRight: '10px'}}></i>Thông tin nhận hàng</h2>
                <form onSubmit={handlePlaceOrder}>
                    <div className="form-group">
                        <label>Họ và tên người nhận</label>
                        <div className="input-wrapper">
                            <i className="fa-solid fa-user"></i>
                            <input type="text" required value={shippingInfo.name} 
                                onChange={(e) => setShippingInfo({...shippingInfo, name: e.target.value})} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Số điện thoại</label>
                        <div className="input-wrapper">
                            <i className="fa-solid fa-phone"></i>
                            <input type="text" required value={shippingInfo.phone} 
                                onChange={(e) => setShippingInfo({...shippingInfo, phone: e.target.value})} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Địa chỉ giao hàng</label>
                        <div className="input-wrapper">
                            <i className="fa-solid fa-house" style={{top: '15px'}}></i>
                            <textarea rows="3" required value={shippingInfo.address} 
                                onChange={(e) => setShippingInfo({...shippingInfo, address: e.target.value})}></textarea>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Phương thức thanh toán</label>
                        <div className="input-wrapper">
                            <i className="fa-solid fa-wallet"></i>
                            <select value={shippingInfo.paymentMethod} onChange={(e) => setShippingInfo({...shippingInfo, paymentMethod: e.target.value})}>
                                <option value="COD">Thanh toán khi nhận hàng (COD)</option>
                                <option value="VNPAY">Thanh toán VNPAY</option>
                            </select>
                        </div>
                    </div>
                    <button type="submit" className="btn-submit">Hoàn tất đặt hàng</button>
                </form>
            </div>

            <div className="checkout-summary">
                <h2>Tóm tắt đơn hàng</h2>
                
                <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '15px' }}>
                    {cartItems.map((item, index) => {
                        const itemPrice = typeof item.price === 'object' ? Number(item.price.$numberDecimal) : item.price;
                        const safeName = typeof item.name === 'object' ? JSON.stringify(item.name) : item.name;
                        const imgSrc = item.images && item.images.length > 0 
                                       ? (item.images[0].startsWith('http') ? item.images[0] : `http://localhost:5000${item.images[0]}`)
                                       : 'https://via.placeholder.com/60';
                        return (
                            <div className="summary-item-card" key={index}>
                                <img src={imgSrc} alt={safeName} />
                                <div className="summary-item-info">
                                    <h4>{safeName}</h4>
                                    <span style={{color: '#666', fontSize: '0.9rem'}}>SL: {item.qty}</span>
                                </div>
                                <div className="summary-item-price">
                                    {(itemPrice * item.qty).toLocaleString('vi-VN')} đ
                                </div>
                            </div>
                        )
                    })}
                </div>

                <div className="coupon-section">
                    <p style={{ fontWeight: 600, marginBottom: '5px', color: '#444' }}>Mã giảm giá</p>
                    <div className="coupon-box">
                        <input 
                            type="text" 
                            placeholder="Nhập mã (VD: SALE10)" 
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value)}
                        />
                        <button type="button" onClick={handleApplyCoupon}>Áp dụng</button>
                    </div>
                    {discount > 0 && (
                        <p style={{ color: '#28a745', fontSize: '0.9rem', marginTop: '10px' }}>
                            <i className="fa-solid fa-check-circle"></i> Đã giảm: {discount.toLocaleString('vi-VN')} đ
                        </p>
                    )}
                </div>

                <div className="final-price-box">
                    <span>Tổng thanh toán:</span>
                    <span id="final-total">{finalTotal.toLocaleString('vi-VN')} đ</span>
                </div>
            </div>
        </div>
    );
};

export default Checkout;