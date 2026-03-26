import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';

const Admin = () => {
    const navigate = useNavigate();
    
    const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(!!localStorage.getItem('adminToken'));
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const [activeTab, setActiveTab] = useState('dashboard');
    const [dashboardData, setDashboardData] = useState({ revenue: 0, ordersCount: 0, completed: 0, pending: 0 });
    const [users, setUsers] = useState([]);
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [requests, setRequests] = useState([]);
    const [coupons, setCoupons] = useState([]);
    
    const [editProductId, setEditProductId] = useState(null);
    const [formData, setFormData] = useState({ name: '', price: '', countInStock: 0, brand: '', category: '', description: '' });
    const fileInputRef = useRef(null);
    const [couponForm, setCouponForm] = useState({ code: '', discount: '', expirationDate: '' });
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [orderStatus, setOrderStatus] = useState('');
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

    const revenueChartRef = useRef(null);
    const statusChartRef = useRef(null);
    const chartInstances = useRef({ revenue: null, status: null });

    const getAuthHeader = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } });

    useEffect(() => {
        if (!isAdminLoggedIn) return;
        if (activeTab === 'dashboard') fetchDashboardData();
        if (activeTab === 'users') fetchUsers();
        if (activeTab === 'products') fetchProducts();
        if (activeTab === 'orders') fetchOrders();
        if (activeTab === 'seller-requests') fetchRequests();
        if (activeTab === 'coupons') fetchCoupons();
        if (activeTab === 'add-product' && editProductId) fetchProductDetail(editProductId);
        if (activeTab === 'add-product' && !editProductId) setFormData({ name: '', price: '', countInStock: 0, brand: '', category: '', description: '' });
    }, [activeTab, editProductId, isAdminLoggedIn]);

    const handleAdminLogin = async (e) => {
        e.preventDefault();
        setIsLoggingIn(true);
        try {
            const res = await axios.post('http://localhost:5000/api/auth/login', { email: loginEmail, password: loginPassword });
            if (res.data.user && res.data.user.isAdmin) {
                localStorage.setItem('adminToken', res.data.accessToken);
                localStorage.setItem('adminUser', JSON.stringify(res.data.user));
                Swal.fire({ title: 'Thành công!', text: 'Đang vào trang Quản trị', icon: 'success', timer: 1000, showConfirmButton: false });
                setIsAdminLoggedIn(true);
                setActiveTab('dashboard');
            } else {
                Swal.fire('Cảnh báo', 'Tài khoản không có quyền Admin!', 'warning');
            }
        } catch (error) {
            Swal.fire('Lỗi', error.response?.data?.message || 'Lỗi đăng nhập', 'error');
        } finally { setIsLoggingIn(false); }
    };

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        setIsAdminLoggedIn(false);
    };

    if (!isAdminLoggedIn) {
        return (
            <div className="admin-login-layout">
                <div className="admin-login-box">
                    <i className="fa-solid fa-shield-halved" style={{fontSize: '3rem', color: '#e74c3c', marginBottom: '10px'}}></i>
                    <h2 style={{color:'#333', marginBottom:'25px'}}>Hệ Thống Quản Trị</h2>
                    <form onSubmit={handleAdminLogin}>
                        <div style={{position:'relative', marginBottom:'20px'}}>
                            <i className="fa-solid fa-envelope" style={{position:'absolute', left:'15px', top:'15px', color:'#888'}}></i>
                            <input type="email" required placeholder="Email quản trị viên" value={loginEmail} onChange={e=>setLoginEmail(e.target.value)} style={{width:'100%', padding:'14px 14px 14px 42px', borderRadius:'8px', border:'1px solid #ddd', background:'#f8f9fa'}}/>
                        </div>
                        <div style={{position:'relative', marginBottom:'20px'}}>
                            <i className="fa-solid fa-lock" style={{position:'absolute', left:'15px', top:'15px', color:'#888'}}></i>
                            <input type="password" required placeholder="Mật khẩu" value={loginPassword} onChange={e=>setLoginPassword(e.target.value)} style={{width:'100%', padding:'14px 14px 14px 42px', borderRadius:'8px', border:'1px solid #ddd', background:'#f8f9fa'}}/>
                        </div>
                        <button type="submit" disabled={isLoggingIn} style={{width:'100%', padding:'14px', background:'#e74c3c', color:'white', border:'none', borderRadius:'8px', fontWeight:'bold', cursor:'pointer'}}>
                            {isLoggingIn ? 'ĐANG XÁC THỰC...' : 'ĐĂNG NHẬP ADMIN'}
                        </button>
                    </form>
                    <div style={{marginTop:'20px'}}><a href="/" style={{color:'#7f8c8d', textDecoration:'none', fontWeight:'600'}}><i className="fa-solid fa-arrow-left"></i> Về trang Khách hàng</a></div>
                </div>
            </div>
        );
    }

    const fetchDashboardData = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/orders', getAuthHeader());
            const allOrders = res.data;
            let revenue = 0, completed = 0, pending = 0;
            let statusCount = { 'Chờ xác nhận': 0, 'Đang đóng gói': 0, 'Đang vận chuyển': 0, 'Hoàn thành': 0, 'Đã hủy': 0, 'Trả hàng': 0 };
            let revByDate = {};

            allOrders.forEach(o => {
                const st = o.status || 'Chờ xác nhận';
                if (statusCount[st] !== undefined) statusCount[st]++;
                if (st === 'Hoàn thành') { revenue += o.totalPrice; completed++; }
                if (st === 'Chờ xác nhận' || st === 'Đang đóng gói') pending++;

                if (st === 'Hoàn thành') {
                    const d = new Date(o.createdAt).toLocaleDateString('vi-VN');
                    revByDate[d] = (revByDate[d] || 0) + o.totalPrice;
                }
            });
            setDashboardData({ revenue, ordersCount: allOrders.length, completed, pending });

            if (window.Chart) {
                if (chartInstances.current.status) chartInstances.current.status.destroy();
                if (chartInstances.current.revenue) chartInstances.current.revenue.destroy();

                chartInstances.current.status = new window.Chart(statusChartRef.current, {
                    type: 'doughnut',
                    data: { labels: Object.keys(statusCount), datasets: [{ data: Object.values(statusCount), backgroundColor: ['#ffc107', '#17a2b8', '#0d6efd', '#198754', '#dc3545', '#6c757d'] }] },
                    options: { responsive: true, maintainAspectRatio: false }
                });

                const dates = Object.keys(revByDate).slice(-7);
                const revs = dates.map(d => revByDate[d]);
                chartInstances.current.revenue = new window.Chart(revenueChartRef.current, {
                    type: 'bar',
                    data: { labels: dates.length ? dates : ['Chưa có'], datasets: [{ label: 'Doanh thu', data: revs.length ? revs : [0], backgroundColor: '#0d6efd', borderRadius: 4 }] },
                    options: { responsive: true, maintainAspectRatio: false }
                });
            }
        } catch (error) { console.error("Lỗi Dashboard", error); }
    };

    const fetchUsers = async () => {
        try { const res = await axios.get('http://localhost:5000/api/users', getAuthHeader()); setUsers(res.data); } catch(e){}
    };
    const fetchProducts = async () => {
        try { const res = await axios.get('http://localhost:5000/api/products?limit=100'); setProducts(res.data.products); } catch(e){}
    };
    const fetchOrders = async () => {
        try { const res = await axios.get('http://localhost:5000/api/orders', getAuthHeader()); setOrders(res.data); } catch(e){}
    };
    const fetchRequests = async () => {
        try { const res = await axios.get('http://localhost:5000/api/users/seller-requests', getAuthHeader()); setRequests(res.data); } catch(e){}
    };
    const fetchCoupons = async () => {
        try { const res = await axios.get('http://localhost:5000/api/coupons', getAuthHeader()); setCoupons(res.data); } catch(e){}
    };
    const fetchProductDetail = async (id) => {
        try { const res = await axios.get(`http://localhost:5000/api/products/${id}`); setFormData({ ...res.data, countInStock: res.data.countInStock || res.data.stock || 0 }); } catch(e){}
    };

    const toggleLockUser = async (id) => {
        try { await axios.put(`http://localhost:5000/api/users/${id}/lock`, {}, getAuthHeader()); fetchUsers(); } catch (e) { Swal.fire('Lỗi', 'Không thể khóa', 'error'); }
    };
    const deleteUser = async (id) => {
        if(await Swal.fire({title: 'Xóa user?', icon: 'warning', showCancelButton: true}).then(r => r.isConfirmed)) {
            await axios.delete(`http://localhost:5000/api/users/${id}`, getAuthHeader()); fetchUsers();
        }
    };
    const deleteProduct = async (id) => {
        if(await Swal.fire({title: 'Xóa sản phẩm?', icon: 'warning', showCancelButton: true}).then(r => r.isConfirmed)) {
            await axios.delete(`http://localhost:5000/api/products/${id}`, getAuthHeader()); fetchProducts();
        }
    };
    const handleRequest = async (id, status, name) => {
        if(await Swal.fire({title: `Duyệt yêu cầu của ${name}?`, icon: 'question', showCancelButton: true}).then(r => r.isConfirmed)) {
            await axios.put(`http://localhost:5000/api/users/seller-requests/${id}`, { status }, getAuthHeader()); fetchRequests();
        }
    };
    const deleteCoupon = async (id) => {
        if(await Swal.fire({title: 'Xóa mã giảm giá?', icon: 'warning', showCancelButton: true}).then(r => r.isConfirmed)) {
            await axios.delete(`http://localhost:5000/api/coupons/${id}`, getAuthHeader()); fetchCoupons();
        }
    };
    const createCoupon = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5000/api/coupons', couponForm, getAuthHeader());
            Swal.fire('Thành công', 'Đã tạo mã', 'success'); setCouponForm({code:'', discount:'', expirationDate:''}); fetchCoupons();
        } catch (e) { Swal.fire('Lỗi', 'Không thể tạo mã', 'error'); }
    };
    
    const handleSaveProduct = async (e) => {
        e.preventDefault();
        const form = new FormData();
        Object.keys(formData).forEach(k => form.append(k, formData[k]));
        if (fileInputRef.current.files.length > 0) form.append('images', fileInputRef.current.files[0]);
        
        Swal.fire({ title: 'Đang xử lý...', didOpen: () => Swal.showLoading() });
        try {
            if (editProductId) await axios.put(`http://localhost:5000/api/products/${editProductId}`, form, getAuthHeader());
            else await axios.post('http://localhost:5000/api/products', form, getAuthHeader());
            Swal.fire('Thành công', 'Đã lưu sản phẩm', 'success'); setEditProductId(null); setActiveTab('products');
        } catch(e) { Swal.fire('Lỗi', 'Không thể lưu', 'error'); }
    };

    const updateOrderStatusAdmin = async () => {
        try {
            await axios.put(`http://localhost:5000/api/orders/${selectedOrder._id}/status`, { status: orderStatus }, getAuthHeader());
            Swal.fire('Thành công', 'Đã đổi trạng thái', 'success'); setIsOrderModalOpen(false); fetchOrders();
        } catch (e) { Swal.fire('Lỗi', 'Lỗi cập nhật', 'error'); }
    };

    return (
        <div className="admin-layout">
            <div className="admin-sidebar">
                <h2><i className="fa-solid fa-gear"></i> MINI ADMIN</h2>
                <ul className="admin-menu">
                    <li className={activeTab==='dashboard'?'active':''} onClick={()=>setActiveTab('dashboard')}><i className="fa-solid fa-chart-pie"></i> Tổng quan</li>
                    <li className={activeTab==='products'||activeTab==='add-product'?'active':''} onClick={()=>{setEditProductId(null); setActiveTab('products');}}><i className="fa-solid fa-boxes-stacked"></i> Sản phẩm</li>
                    <li className={activeTab==='orders'?'active':''} onClick={()=>setActiveTab('orders')}><i className="fa-solid fa-cart-flatbed"></i> Đơn hàng</li>
                    <li className={activeTab==='users'?'active':''} onClick={()=>setActiveTab('users')}><i className="fa-solid fa-users-gear"></i> Người dùng</li>
                    <li className={activeTab==='seller-requests'?'active':''} onClick={()=>setActiveTab('seller-requests')}><i className="fa-solid fa-user-clock"></i> Duyệt Người Bán</li>
                    <li className={activeTab==='coupons'?'active':''} onClick={()=>setActiveTab('coupons')}><i className="fa-solid fa-ticket"></i> Mã giảm giá</li>
                </ul>
                <div className="admin-logout" onClick={handleLogout}><i className="fa-solid fa-right-from-bracket"></i> Đăng xuất</div>
            </div>

            <div className="admin-main">
                <div className="admin-topbar">
                    <h3 style={{margin:0, color:'#555'}}>{activeTab.toUpperCase().replace('-', ' ')}</h3>
                    <div style={{fontWeight:600, color:'#0d6efd'}}><i className="fa-solid fa-shield-halved"></i> Quản trị viên</div>
                </div>

                <div className="admin-content">
                    {activeTab === 'dashboard' && (
                        <>
                            <div className="admin-cards-grid">
                                <div className="admin-card"><h4>Doanh thu (Đã giao)</h4><p style={{color:'#ee4d2d'}}>{dashboardData.revenue.toLocaleString('vi-VN')} đ</p></div>
                                <div className="admin-card blue"><h4>Tổng Đơn hàng</h4><p>{dashboardData.ordersCount}</p></div>
                                <div className="admin-card green"><h4>Đơn thành công</h4><p>{dashboardData.completed}</p></div>
                                <div className="admin-card yellow"><h4>Đơn đang chờ</h4><p>{dashboardData.pending}</p></div>
                            </div>
                            <div className="admin-charts-grid">
                                <div className="admin-chart-container"><h3>Doanh thu 7 ngày</h3><div style={{height:'350px'}}><canvas ref={revenueChartRef}></canvas></div></div>
                                <div className="admin-chart-container"><h3>Tỷ lệ Trạng thái</h3><div style={{height:'350px'}}><canvas ref={statusChartRef}></canvas></div></div>
                            </div>
                        </>
                    )}

                    {activeTab === 'users' && (
                        <table className="admin-table">
                            <thead><tr><th>Tên & Email</th><th style={{textAlign:'center'}}>Phân quyền</th><th style={{textAlign:'center'}}>Trạng thái</th><th style={{textAlign:'center'}}>Hành động</th></tr></thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u._id}>
                                        <td><strong>{u.name}</strong><br/><small style={{color:'#666'}}>{u.email}</small></td>
                                        <td style={{textAlign:'center'}}>{u.isAdmin ? <span className="badge bg-admin">Admin</span> : <span className="badge bg-user">Khách</span>}</td>
                                        <td style={{textAlign:'center'}}>{u.isLocked ? <span className="badge bg-locked">Đã Khóa</span> : <span className="badge bg-active">Bình thường</span>}</td>
                                        <td style={{textAlign:'center'}}>
                                            {!u.isAdmin && <>
                                                <button className="btn-action" style={{background: u.isLocked?'#28a745':'#ffc107', color: u.isLocked?'#fff':'#333'}} onClick={()=>toggleLockUser(u._id)}>{u.isLocked ? 'Mở khóa' : 'Khóa'}</button>
                                                <button className="btn-action" style={{background:'#dc3545'}} onClick={()=>deleteUser(u._id)}>Xóa</button>
                                            </>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    {activeTab === 'products' && (
                        <>
                            <button className="btn-action" style={{background:'#28a745', marginBottom:'15px', padding:'10px 20px'}} onClick={()=>{setEditProductId(null); setActiveTab('add-product');}}>+ Thêm sản phẩm mới</button>
                            <table className="admin-table">
                                <thead><tr><th>Tên sản phẩm</th><th>Giá</th><th style={{textAlign:'center'}}>Kho</th><th style={{textAlign:'center'}}>Hành động</th></tr></thead>
                                <tbody>
                                    {products.map(p => (
                                        <tr key={p._id}>
                                            <td><div style={{display:'flex', gap:'10px'}}><img src={p.images?.[0]?.startsWith('http') ? p.images[0] : `http://localhost:5000${p.images?.[0]}`} width="40" height="40" /> <strong>{p.name}</strong></div></td>
                                            <td style={{color:'#ee4d2d', fontWeight:'bold'}}>{Number(p.price?.['$numberDecimal'] || p.price).toLocaleString()} đ</td>
                                            <td style={{textAlign:'center'}}>{p.countInStock}</td>
                                            <td style={{textAlign:'center'}}>
                                                <button className="btn-action" style={{background:'#17a2b8'}} onClick={()=>{setEditProductId(p._id); setActiveTab('add-product');}}>Sửa</button>
                                                <button className="btn-action" style={{background:'#dc3545'}} onClick={()=>deleteProduct(p._id)}>Xóa</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </>
                    )}

                    {activeTab === 'add-product' && (
                        <div style={{background:'white', padding:'30px', borderRadius:'8px', maxWidth:'800px', margin:'0 auto'}}>
                            <h2 style={{textAlign:'center'}}>{editProductId ? 'SỬA SẢN PHẨM' : 'THÊM MỚI'}</h2>
                            <form onSubmit={handleSaveProduct}>
                                <div style={{marginBottom:'15px'}}><label>Tên SP</label><input type="text" required style={{width:'100%', padding:'10px'}} value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})} /></div>
                                <div style={{display:'flex', gap:'15px', marginBottom:'15px'}}>
                                    <div style={{flex:1}}><label>Giá</label><input type="number" required style={{width:'100%', padding:'10px'}} value={formData.price} onChange={e=>setFormData({...formData, price:e.target.value})} /></div>
                                    <div style={{flex:1}}><label>Kho</label><input type="number" required style={{width:'100%', padding:'10px'}} value={formData.countInStock} onChange={e=>setFormData({...formData, countInStock:e.target.value})} /></div>
                                </div>
                                <div style={{display:'flex', gap:'15px', marginBottom:'15px'}}>
                                    <div style={{flex:1}}><label>Thương hiệu</label><input type="text" required style={{width:'100%', padding:'10px'}} value={formData.brand} onChange={e=>setFormData({...formData, brand:e.target.value})} /></div>
                                    <div style={{flex:1}}><label>Danh mục</label><input type="text" required style={{width:'100%', padding:'10px'}} value={formData.category} onChange={e=>setFormData({...formData, category:e.target.value})} /></div>
                                </div>
                                <div style={{marginBottom:'15px'}}><label>Ảnh (1 ảnh)</label><br/><input type="file" accept="image/*" ref={fileInputRef}/></div>
                                <div style={{marginBottom:'15px'}}><label>Mô tả</label><textarea rows="4" style={{width:'100%', padding:'10px'}} value={formData.description} onChange={e=>setFormData({...formData, description:e.target.value})}></textarea></div>
                                <div style={{textAlign:'center'}}><button type="submit" className="btn-action" style={{background:'#ee4d2d', padding:'10px 30px'}}>LƯU</button></div>
                            </form>
                        </div>
                    )}

                    {activeTab === 'orders' && (
                        <>
                            <table className="admin-table">
                                <thead><tr><th>Mã Đơn</th><th>Khách hàng</th><th>Tổng tiền</th><th style={{textAlign:'center'}}>Trạng thái</th><th style={{textAlign:'center'}}>Hành động</th></tr></thead>
                                <tbody>
                                    {orders.map(o => (
                                        <tr key={o._id}>
                                            <td style={{color:'#0056b3', fontWeight:'bold'}}>#{o._id.slice(-6).toUpperCase()}</td>
                                            <td>{o.customerName}<br/><small>{o.phone}</small></td>
                                            <td style={{color:'#ee4d2d', fontWeight:'bold'}}>{o.totalPrice.toLocaleString()} đ</td>
                                            <td style={{textAlign:'center'}}><span className="badge bg-pending">{o.status}</span></td>
                                            <td style={{textAlign:'center'}}><button className="btn-action" style={{background:'#0d6efd'}} onClick={()=>{setSelectedOrder(o); setOrderStatus(o.status); setIsOrderModalOpen(true);}}>Cập nhật</button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {isOrderModalOpen && selectedOrder && (
                                <div style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000}}>
                                    <div style={{background:'white', padding:'25px', borderRadius:'12px', width:'400px'}}>
                                        <h3 style={{marginTop:0}}>Cập nhật đơn: #{selectedOrder._id.slice(-6).toUpperCase()}</h3>
                                        <select value={orderStatus} onChange={e=>setOrderStatus(e.target.value)} style={{width:'100%', padding:'10px', marginBottom:'20px'}}>
                                            <option value="Chờ xác nhận">Chờ xác nhận</option>
                                            <option value="Đang đóng gói">Đang đóng gói</option>
                                            <option value="Đang vận chuyển">Đang vận chuyển</option>
                                            <option value="Hoàn thành">Hoàn thành (Đã giao)</option>
                                            <option value="Đã hủy">Hủy đơn</option>
                                            <option value="Trả hàng">Trả hàng</option>
                                        </select>
                                        <div style={{display:'flex', justifyContent:'flex-end', gap:'10px'}}>
                                            <button className="btn-action" style={{background:'#6c757d'}} onClick={()=>setIsOrderModalOpen(false)}>Hủy</button>
                                            <button className="btn-action" style={{background:'#28a745'}} onClick={updateOrderStatusAdmin}>Lưu thay đổi</button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {activeTab === 'seller-requests' && (
                        <table className="admin-table">
                            <thead><tr><th>Tên Khách hàng</th><th>Email</th><th>Trạng thái</th><th style={{textAlign:'center'}}>Hành động</th></tr></thead>
                            <tbody>
                                {requests.map(r => (
                                    <tr key={r._id}>
                                        <td><strong>{r.name}</strong></td><td>{r.email}</td><td><span className="badge bg-pending">Chờ duyệt</span></td>
                                        <td style={{textAlign:'center'}}>
                                            <button className="btn-action" style={{background:'#198754'}} onClick={()=>handleRequest(r._id, 'approved', r.name)}>Duyệt</button>
                                            <button className="btn-action" style={{background:'#dc3545'}} onClick={()=>handleRequest(r._id, 'rejected', r.name)}>Từ chối</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    {activeTab === 'coupons' && (
                        <>
                            <div style={{background:'white', padding:'20px', borderRadius:'8px', marginBottom:'20px', borderLeft:'4px solid #ee4d2d'}}>
                                <form onSubmit={createCoupon} style={{display:'flex', gap:'15px', alignItems:'flex-end'}}>
                                    <div style={{flex:1}}><label>Mã Voucher</label><input type="text" required style={{width:'100%', padding:'10px', textTransform:'uppercase'}} value={couponForm.code} onChange={e=>setCouponForm({...couponForm, code:e.target.value})}/></div>
                                    <div style={{flex:1}}><label>Giảm (%)</label><input type="number" required style={{width:'100%', padding:'10px'}} value={couponForm.discount} onChange={e=>setCouponForm({...couponForm, discount:e.target.value})}/></div>
                                    <div style={{flex:1}}><label>Hạn Dùng</label><input type="date" required style={{width:'100%', padding:'10px'}} value={couponForm.expirationDate} onChange={e=>setCouponForm({...couponForm, expirationDate:e.target.value})}/></div>
                                    <button type="submit" className="btn-action" style={{background:'#ee4d2d', padding:'10px 20px'}}>Lưu Mã</button>
                                </form>
                            </div>
                            <table className="admin-table">
                                <thead><tr><th>Mã Voucher</th><th>Mức giảm</th><th>Hết hạn</th><th style={{textAlign:'center'}}>Thao tác</th></tr></thead>
                                <tbody>
                                    {coupons.map(c => {
                                        const isExpired = new Date(c.expirationDate) < new Date();
                                        return (
                                            <tr key={c._id}>
                                                <td style={{fontWeight:'bold', color:'#ee4d2d'}}>{c.code}</td>
                                                <td>{c.discount}%</td>
                                                <td>{new Date(c.expirationDate).toLocaleDateString('vi-VN')} {isExpired && <span className="badge bg-expired">Hết hạn</span>}</td>
                                                <td style={{textAlign:'center'}}><button className="btn-action" style={{background:'#dc3545'}} onClick={()=>deleteCoupon(c._id)}>Xóa</button></td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Admin;