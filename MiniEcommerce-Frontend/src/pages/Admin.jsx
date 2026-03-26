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

    const [isProcessing, setIsProcessing] = useState(false);

    const [activeTab, setActiveTab] = useState('dashboard');
    const [dashboardData, setDashboardData] = useState({ revenue: 0, ordersCount: 0, completed: 0, pending: 0 });
    const [users, setUsers] = useState([]);
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [requests, setRequests] = useState([]);
    const [coupons, setCoupons] = useState([]);
    
    const [editProductId, setEditProductId] = useState(null);
    const [formData, setFormData] = useState({ name: '', price: '', countInStock: 0, brand: '', category: '', description: '', images: [] });
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
        if (activeTab === 'add-product' && !editProductId) setFormData({ name: '', price: '', countInStock: 0, brand: '', category: '', description: '', images: [] });
    }, [activeTab, editProductId, isAdminLoggedIn]);

    const handleAdminLogin = async (e) => {
        e.preventDefault();
        setIsLoggingIn(true);
        try {
            const res = await axios.post('http://localhost:5000/api/auth/login', { email: loginEmail, password: loginPassword });
            if (res.data.user && res.data.user.isAdmin) {
                localStorage.setItem('adminToken', res.data.accessToken);
                localStorage.setItem('adminUser', JSON.stringify(res.data.user));
                Swal.fire({ title: 'Thành công!', text: 'Đăng nhập Quản trị thành công', icon: 'success', timer: 1500, showConfirmButton: false });
                setIsAdminLoggedIn(true);
                setActiveTab('dashboard');
            } else {
                Swal.fire('Cảnh báo', 'Tài khoản này không có quyền Admin!', 'warning');
            }
        } catch (error) { 
            Swal.fire('Lỗi đăng nhập', error.response?.data?.message || 'Sai tài khoản hoặc mật khẩu', 'error'); 
        } finally { 
            setIsLoggingIn(false); 
        }
    };

    const handleLogout = () => { localStorage.removeItem('adminToken'); localStorage.removeItem('adminUser'); setIsAdminLoggedIn(false); };

    if (!isAdminLoggedIn) {
        return (
            <div className="admin-login-layout" style={{background: 'linear-gradient(135deg, #1e293b 0%, #2c3e50 100%)', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', position: 'fixed', top:0, left:0, width:'100vw', zIndex: 99 }}>
                <div className="admin-login-box" style={{background: 'white', padding: '40px 35px', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', width: '100%', maxWidth: '400px', textAlign: 'center'}}>
                    <i className="fa-solid fa-shield-halved" style={{fontSize: '3rem', color: '#e74c3c', marginBottom: '10px'}}></i>
                    <h2 style={{color:'#333', marginBottom:'25px'}}>Hệ Thống Quản Trị</h2>
                    <form onSubmit={handleAdminLogin}>
                        <div style={{position:'relative', marginBottom:'20px'}}><i className="fa-solid fa-envelope" style={{position:'absolute', left:'15px', top:'15px', color:'#888'}}></i><input type="email" required placeholder="Email quản trị viên" value={loginEmail} onChange={e=>setLoginEmail(e.target.value)} style={{width:'100%', padding:'14px 14px 14px 42px', borderRadius:'8px', border:'1px solid #ddd', background:'#f8f9fa', boxSizing:'border-box'}}/></div>
                        <div style={{position:'relative', marginBottom:'20px'}}><i className="fa-solid fa-lock" style={{position:'absolute', left:'15px', top:'15px', color:'#888'}}></i><input type="password" required placeholder="Mật khẩu" value={loginPassword} onChange={e=>setLoginPassword(e.target.value)} style={{width:'100%', padding:'14px 14px 14px 42px', borderRadius:'8px', border:'1px solid #ddd', background:'#f8f9fa', boxSizing:'border-box'}}/></div>
                        <button type="submit" disabled={isLoggingIn} style={{width:'100%', padding:'14px', background:'#e74c3c', color:'white', border:'none', borderRadius:'8px', fontWeight:'bold', cursor:'pointer'}}>{isLoggingIn ? 'ĐANG XÁC THỰC...' : 'ĐĂNG NHẬP ADMIN'}</button>
                    </form>
                    <div style={{marginTop:'20px'}}><a href="/" style={{color:'#7f8c8d', textDecoration:'none', fontWeight:'600'}}><i className="fa-solid fa-arrow-left"></i> Về trang Khách hàng</a></div>
                </div>
            </div>
        );
    }

    const fetchDashboardData = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/orders', getAuthHeader());
            let revenue = 0, completed = 0, pending = 0;
            let statusCount = { 'Chờ xác nhận': 0, 'Đang đóng gói': 0, 'Đang vận chuyển': 0, 'Hoàn thành': 0, 'Đã hủy': 0, 'Trả hàng': 0 };
            let revByDate = {};
            res.data.forEach(o => {
                const st = o.status || 'Chờ xác nhận';
                if (statusCount[st] !== undefined) statusCount[st]++;
                if (st === 'Hoàn thành') { revenue += o.totalPrice; completed++; const d = new Date(o.createdAt).toLocaleDateString('vi-VN'); revByDate[d] = (revByDate[d] || 0) + o.totalPrice; }
                if (st === 'Chờ xác nhận' || st === 'Đang đóng gói') pending++;
            });
            setDashboardData({ revenue, ordersCount: res.data.length, completed, pending });
            if (window.Chart) {
                if (chartInstances.current.status) chartInstances.current.status.destroy();
                if (chartInstances.current.revenue) chartInstances.current.revenue.destroy();
                chartInstances.current.status = new window.Chart(statusChartRef.current, { type: 'doughnut', data: { labels: Object.keys(statusCount), datasets: [{ data: Object.values(statusCount), backgroundColor: ['#ffc107', '#17a2b8', '#0d6efd', '#198754', '#dc3545', '#6c757d'] }] }, options: { responsive: true, maintainAspectRatio: false } });
                const dates = Object.keys(revByDate).slice(-7);
                const revs = dates.map(d => revByDate[d]);
                chartInstances.current.revenue = new window.Chart(revenueChartRef.current, { type: 'bar', data: { labels: dates.length ? dates : ['Chưa có'], datasets: [{ label: 'Doanh thu', data: revs.length ? revs : [0], backgroundColor: '#0d6efd', borderRadius: 4 }] }, options: { responsive: true, maintainAspectRatio: false } });
            }
        } catch (error) {}
    };
    const fetchUsers = async () => { try { const res = await axios.get('http://localhost:5000/api/users', getAuthHeader()); setUsers(res.data); } catch(e){} };
    const fetchProducts = async () => { try { const res = await axios.get('http://localhost:5000/api/products?limit=100'); setProducts(res.data.products); } catch(e){} };
    const fetchOrders = async () => { try { const res = await axios.get('http://localhost:5000/api/orders', getAuthHeader()); setOrders(res.data); } catch(e){} };
    const fetchRequests = async () => { try { const res = await axios.get('http://localhost:5000/api/users/seller-requests', getAuthHeader()); setRequests(res.data); } catch(e){} };
    const fetchCoupons = async () => { try { const res = await axios.get('http://localhost:5000/api/coupons', getAuthHeader()); setCoupons(res.data); } catch(e){} };
    
    const fetchProductDetail = async (id) => { 
        try { 
            const res = await axios.get(`http://localhost:5000/api/products/${id}`); 
            setFormData({ ...res.data, countInStock: res.data.countInStock || res.data.stock || 0 }); 
        } catch(e){} 
    };

    const toggleLockUser = async (id) => { try { await axios.put(`http://localhost:5000/api/users/${id}/lock`, {}, getAuthHeader()); fetchUsers(); } catch (e) { Swal.fire('Lỗi', 'Không thể khóa', 'error'); } };
    
    const deleteUser = async (id) => { 
        const result = await Swal.fire({title: 'Xóa người dùng?', text: 'Dữ liệu không thể khôi phục!', icon: 'warning', showCancelButton: true, confirmButtonText: 'Xóa'});
        if(result.isConfirmed) { 
            try { 
                await axios.delete(`http://localhost:5000/api/users/${id}`, getAuthHeader()); 
                Swal.fire('Thành công', 'Đã xóa người dùng', 'success');
                fetchUsers(); 
            } catch(e){ Swal.fire('Lỗi', e.response?.data?.message || 'Không thể xóa', 'error'); } 
        } 
    };
    
    const deleteProduct = async (id) => { 
        const result = await Swal.fire({title: 'Xóa sản phẩm?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Xóa'});
        if(result.isConfirmed) { 
            try { 
                await axios.delete(`http://localhost:5000/api/products/${id}`, getAuthHeader()); 
                Swal.fire('Thành công', 'Đã xóa sản phẩm', 'success');
                fetchProducts(); 
            } catch(e){ Swal.fire('Lỗi', 'Không thể xóa', 'error'); } 
        } 
    };
    
    const handleRequest = async (id, status, name) => {
        const text = status === 'approved' ? 'duyệt' : 'từ chối';
        const result = await Swal.fire({title: `Xác nhận ${text}?`, text: `Yêu cầu của ${name}`, icon: 'question', showCancelButton: true, confirmButtonText: 'Đồng ý'});
        if(result.isConfirmed) {
            try {
                await axios.put(`http://localhost:5000/api/users/seller-requests/${id}`, { status: status }, getAuthHeader());
                Swal.fire('Thành công', `Đã ${text} yêu cầu`, 'success');
                fetchRequests();
            } catch(e) { Swal.fire('Lỗi', 'Lỗi xử lý yêu cầu', 'error'); }
        }
    };
    
    const deleteCoupon = async (id) => { 
        const result = await Swal.fire({title: 'Xóa mã giảm giá?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Xóa'});
        if(result.isConfirmed) { 
            try { 
                await axios.delete(`http://localhost:5000/api/coupons/${id}`, getAuthHeader()); 
                Swal.fire('Thành công', 'Đã xóa mã', 'success');
                fetchCoupons(); 
            } catch(e){ Swal.fire('Lỗi','Không thể xóa','error'); } 
        } 
    };
    
    const createCoupon = async (e) => {
        e.preventDefault();
        if (isProcessing) return;
        setIsProcessing(true);
        try {
            await axios.post('http://localhost:5000/api/coupons', couponForm, getAuthHeader());
            Swal.fire('Thành công', 'Đã tạo mã giảm giá', 'success'); 
            setCouponForm({code:'', discount:'', expirationDate:''}); 
            fetchCoupons();
        } catch (e) { 
            Swal.fire('Lỗi', e.response?.data?.message || 'Không thể tạo mã', 'error'); 
        } finally {
            setIsProcessing(false);
        }
    };
    
    const handleSaveProduct = async (e) => {
        e.preventDefault();
        if (isProcessing) return;
        
        setIsProcessing(true);
        Swal.fire({ title: 'Đang xử lý...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        try {
            let finalImageUrl = formData.images?.[0] || '';
            const files = fileInputRef.current.files;
            
            if (files.length > 0) {
                const uploadForm = new FormData();
                uploadForm.append('image', files[0]);
                const uploadRes = await axios.post('http://localhost:5000/api/upload', uploadForm, getAuthHeader());
                finalImageUrl = uploadRes.data.imageUrl;
            } else if (!editProductId && !finalImageUrl) {
                Swal.fire('Lỗi', 'Vui lòng chọn ít nhất 1 ảnh!', 'warning');
                setIsProcessing(false);
                return;
            }

            const productData = {
                name: formData.name,
                price: Number(formData.price),
                countInStock: Number(formData.countInStock),
                brand: formData.brand,
                category: formData.category,
                description: formData.description,
                images: [finalImageUrl]
            };

            if (editProductId) {
                await axios.put(`http://localhost:5000/api/products/${editProductId}`, productData, getAuthHeader());
            } else {
                await axios.post('http://localhost:5000/api/products', productData, getAuthHeader());
            }
            
            Swal.fire('Thành công', 'Đã lưu thông tin sản phẩm', 'success'); 
            setEditProductId(null); 
            setActiveTab('products');
        } catch(e) { 
            Swal.fire('Lỗi', e.response?.data?.message || 'Không thể lưu', 'error'); 
        } finally {
            setIsProcessing(false);
        }
    };

    const updateOrderStatusAdmin = async () => {
        try {
            await axios.put(`http://localhost:5000/api/orders/${selectedOrder._id}/status`, { status: orderStatus }, getAuthHeader());
            Swal.fire('Thành công', 'Đã đổi trạng thái đơn hàng', 'success'); 
            setIsOrderModalOpen(false); 
            fetchOrders();
        } catch (e) { Swal.fire('Lỗi', 'Không thể cập nhật', 'error'); }
    };

    return (
        <div className="admin-layout" style={{ display: 'flex', height: '100vh', background: '#f4f6f9', fontFamily: 'Inter', position: 'fixed', top: 0, left: 0, width: '100vw', zIndex: 99 }}>
            <div className="admin-sidebar" style={{width: '250px', background: '#343a40', color: 'white', display: 'flex', flexDirection: 'column'}}>
                <h2 style={{textAlign: 'center', padding: '20px 0', margin: 0, background: '#23272b', borderBottom: '1px solid #4f5962', fontSize: '1.2rem'}}><i className="fa-solid fa-gear"></i> MINI ADMIN</h2>
                <ul className="admin-menu" style={{listStyle: 'none', padding: 0, margin: 0, flex: 1}}>
                    <li className={activeTab==='dashboard'?'active':''} onClick={()=>setActiveTab('dashboard')} style={{padding: '15px 20px', cursor:'pointer', borderBottom: '1px solid #4f5962', background: activeTab==='dashboard' ? '#ee4d2d' : 'transparent'}}><i className="fa-solid fa-chart-pie" style={{marginRight:'10px'}}></i> Tổng quan</li>
                    <li className={activeTab==='products'||activeTab==='add-product'?'active':''} onClick={()=>{setEditProductId(null); setActiveTab('products');}} style={{padding: '15px 20px', cursor:'pointer', borderBottom: '1px solid #4f5962', background: activeTab==='products'||activeTab==='add-product' ? '#ee4d2d' : 'transparent'}}><i className="fa-solid fa-boxes-stacked" style={{marginRight:'10px'}}></i> Sản phẩm</li>
                    <li className={activeTab==='orders'?'active':''} onClick={()=>setActiveTab('orders')} style={{padding: '15px 20px', cursor:'pointer', borderBottom: '1px solid #4f5962', background: activeTab==='orders' ? '#ee4d2d' : 'transparent'}}><i className="fa-solid fa-cart-flatbed" style={{marginRight:'10px'}}></i> Đơn hàng</li>
                    <li className={activeTab==='users'?'active':''} onClick={()=>setActiveTab('users')} style={{padding: '15px 20px', cursor:'pointer', borderBottom: '1px solid #4f5962', background: activeTab==='users' ? '#ee4d2d' : 'transparent'}}><i className="fa-solid fa-users-gear" style={{marginRight:'10px'}}></i> Người dùng</li>
                    <li className={activeTab==='seller-requests'?'active':''} onClick={()=>setActiveTab('seller-requests')} style={{padding: '15px 20px', cursor:'pointer', borderBottom: '1px solid #4f5962', background: activeTab==='seller-requests' ? '#ee4d2d' : 'transparent'}}><i className="fa-solid fa-user-clock" style={{marginRight:'10px'}}></i> Duyệt Shop</li>
                    <li className={activeTab==='coupons'?'active':''} onClick={()=>setActiveTab('coupons')} style={{padding: '15px 20px', cursor:'pointer', borderBottom: '1px solid #4f5962', background: activeTab==='coupons' ? '#ee4d2d' : 'transparent'}}><i className="fa-solid fa-ticket" style={{marginRight:'10px'}}></i> Voucher</li>
                </ul>
                <div onClick={handleLogout} style={{padding: '15px', background: '#dc3545', color: 'white', textAlign: 'center', cursor: 'pointer'}}><i className="fa-solid fa-right-from-bracket"></i> Đăng xuất</div>
            </div>

            <div className="admin-main" style={{flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto'}}>
                <div className="admin-topbar" style={{background: 'white', padding: '15px 30px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <h3 style={{margin:0, color:'#555'}}>{activeTab.toUpperCase().replace('-', ' ')}</h3>
                    <div style={{fontWeight:600, color:'#0d6efd'}}><i className="fa-solid fa-shield-halved"></i> Quản trị viên</div>
                </div>

                <div className="admin-content" style={{padding: '30px', flex: 1}}>
                    {activeTab === 'dashboard' && (
                        <>
                            <div className="admin-cards-grid" style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px'}}>
                                <div className="admin-card" style={{background: 'white', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #ee4d2d'}}><h4>Doanh thu (Đã giao)</h4><p style={{color:'#ee4d2d', fontSize: '1.8rem', fontWeight: 'bold', margin: 0}}>{dashboardData.revenue.toLocaleString('vi-VN')} đ</p></div>
                                <div className="admin-card blue" style={{background: 'white', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #0d6efd'}}><h4>Tổng Đơn hàng</h4><p style={{fontSize: '1.8rem', fontWeight: 'bold', margin: 0}}>{dashboardData.ordersCount}</p></div>
                                <div className="admin-card green" style={{background: 'white', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #198754'}}><h4>Đơn thành công</h4><p style={{fontSize: '1.8rem', fontWeight: 'bold', margin: 0}}>{dashboardData.completed}</p></div>
                                <div className="admin-card yellow" style={{background: 'white', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #ffc107'}}><h4>Đơn đang chờ</h4><p style={{fontSize: '1.8rem', fontWeight: 'bold', margin: 0}}>{dashboardData.pending}</p></div>
                            </div>
                            <div className="admin-charts-grid" style={{display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px'}}>
                                <div className="admin-chart-container" style={{background: 'white', padding: '20px', borderRadius: '8px'}}><h3>Doanh thu 7 ngày</h3><div style={{height:'350px'}}><canvas ref={revenueChartRef}></canvas></div></div>
                                <div className="admin-chart-container" style={{background: 'white', padding: '20px', borderRadius: '8px'}}><h3>Tỷ lệ Trạng thái</h3><div style={{height:'350px'}}><canvas ref={statusChartRef}></canvas></div></div>
                            </div>
                        </>
                    )}

                    {activeTab === 'users' && (
                        <table style={{width: '100%', background: 'white', borderCollapse: 'collapse', borderRadius: '8px', overflow: 'hidden'}}>
                            <thead><tr style={{background: '#f8f9fa', textAlign: 'left'}}><th style={{padding: '15px'}}>Tên & Email</th><th style={{textAlign:'center'}}>Phân quyền</th><th style={{textAlign:'center'}}>Trạng thái</th><th style={{textAlign:'center'}}>Hành động</th></tr></thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u._id} style={{borderBottom: '1px solid #eee'}}>
                                        <td style={{padding: '15px'}}><strong>{u.name}</strong><br/><small style={{color:'#666'}}>{u.email}</small></td>
                                        <td style={{textAlign:'center'}}>{u.isAdmin ? <span style={{background: '#cce5ff', color: '#004085', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold'}}>Admin</span> : <span style={{background: '#d4edda', color: '#155724', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold'}}>Khách</span>}</td>
                                        <td style={{textAlign:'center'}}>{u.isLocked ? <span style={{background: '#f8d7da', color: '#721c24', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold'}}>Đã Khóa</span> : <span style={{background: '#d4edda', color: '#155724', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold'}}>Bình thường</span>}</td>
                                        <td style={{textAlign:'center'}}>
                                            {!u.isAdmin && <>
                                                <button style={{background: u.isLocked?'#28a745':'#ffc107', color: u.isLocked?'#fff':'#333', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer', marginRight: '5px', fontWeight: 'bold'}} onClick={()=>toggleLockUser(u._id)}>{u.isLocked ? 'Mở khóa' : 'Khóa'}</button>
                                                <button style={{background:'#dc3545', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'}} onClick={()=>deleteUser(u._id)}>Xóa</button>
                                            </>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    {activeTab === 'products' && (
                        <>
                            <button style={{background:'#28a745', color: 'white', border: 'none', padding:'10px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '15px'}} onClick={()=>{setEditProductId(null); setActiveTab('add-product');}}>+ Thêm sản phẩm mới</button>
                            <table style={{width: '100%', background: 'white', borderCollapse: 'collapse', borderRadius: '8px', overflow: 'hidden'}}>
                                <thead><tr style={{background: '#f8f9fa', textAlign: 'left'}}><th style={{padding: '15px'}}>Sản phẩm</th><th style={{padding: '15px'}}>Giá</th><th style={{textAlign:'center'}}>Kho</th><th style={{textAlign:'center'}}>Hành động</th></tr></thead>
                                <tbody>
                                    {products.map(p => (
                                        <tr key={p._id} style={{borderBottom: '1px solid #eee'}}>
                                            <td style={{padding: '15px'}}><div style={{display:'flex', gap:'10px'}}><img src={p.images?.[0]?.startsWith('http') ? p.images[0] : `http://localhost:5000${p.images?.[0]}`} width="40" height="40" style={{objectFit: 'contain'}}/> <strong>{p.name}</strong></div></td>
                                            <td style={{color:'#ee4d2d', fontWeight:'bold', padding: '15px'}}>{Number(p.price?.['$numberDecimal'] || p.price).toLocaleString()} đ</td>
                                            <td style={{textAlign:'center'}}><span style={{padding: '4px 10px', borderRadius: '12px', background: p.countInStock > 0 || p.stock > 0 ? '#e6f4ea' : '#f8d7da', color: p.countInStock > 0 || p.stock > 0 ? '#1e7e34' : '#721c24', fontWeight: 'bold'}}>{p.countInStock || p.stock || 0}</span></td>
                                            <td style={{textAlign:'center'}}>
                                                <button style={{background:'#ffc107', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer', marginRight: '5px', fontWeight: 'bold'}} onClick={()=>{setEditProductId(p._id); setActiveTab('add-product');}}>Sửa</button>
                                                <button style={{background:'#dc3545', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'}} onClick={()=>deleteProduct(p._id)}>Xóa</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </>
                    )}

                    {activeTab === 'add-product' && (
                        <div style={{background:'white', padding:'30px', borderRadius:'8px', maxWidth:'800px', margin:'0 auto'}}>
                            <h2 style={{textAlign:'center', marginTop: 0}}>{editProductId ? 'SỬA SẢN PHẨM' : 'THÊM MỚI'}</h2>
                            <form onSubmit={handleSaveProduct}>
                                <div style={{marginBottom:'15px'}}><label style={{fontWeight: 'bold'}}>Tên SP</label><input type="text" required style={{width:'100%', padding:'10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box', marginTop: '5px'}} value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})} /></div>
                                <div style={{display:'flex', gap:'15px', marginBottom:'15px'}}>
                                    <div style={{flex:1}}><label style={{fontWeight: 'bold'}}>Giá</label><input type="number" required style={{width:'100%', padding:'10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box', marginTop: '5px'}} value={formData.price} onChange={e=>setFormData({...formData, price:e.target.value})} /></div>
                                    <div style={{flex:1}}><label style={{fontWeight: 'bold'}}>Kho</label><input type="number" required style={{width:'100%', padding:'10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box', marginTop: '5px'}} value={formData.countInStock} onChange={e=>setFormData({...formData, countInStock:e.target.value})} /></div>
                                </div>
                                <div style={{display:'flex', gap:'15px', marginBottom:'15px'}}>
                                    <div style={{flex:1}}><label style={{fontWeight: 'bold'}}>Thương hiệu</label><input type="text" required style={{width:'100%', padding:'10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box', marginTop: '5px'}} value={formData.brand} onChange={e=>setFormData({...formData, brand:e.target.value})} /></div>
                                    <div style={{flex:1}}><label style={{fontWeight: 'bold'}}>Danh mục</label><input type="text" required style={{width:'100%', padding:'10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box', marginTop: '5px'}} value={formData.category} onChange={e=>setFormData({...formData, category:e.target.value})} /></div>
                                </div>
                                <div style={{marginBottom:'15px'}}><label style={{fontWeight: 'bold'}}>Ảnh (1 ảnh)</label><br/><input type="file" accept="image/*" ref={fileInputRef} style={{marginTop: '5px'}}/></div>
                                <div style={{marginBottom:'15px'}}><label style={{fontWeight: 'bold'}}>Mô tả</label><textarea rows="4" style={{width:'100%', padding:'10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box', marginTop: '5px'}} value={formData.description} onChange={e=>setFormData({...formData, description:e.target.value})}></textarea></div>
                                
                                <div style={{textAlign:'center'}}>
                                    <button type="submit" disabled={isProcessing} style={{background: isProcessing ? '#ccc' : '#ee4d2d', color: 'white', border: 'none', padding:'10px 30px', borderRadius: '6px', fontWeight: 'bold', cursor: isProcessing ? 'not-allowed' : 'pointer'}}>
                                        {isProcessing ? 'ĐANG LƯU...' : 'LƯU DỮ LIỆU'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {activeTab === 'orders' && (
                        <>
                            <table style={{width: '100%', background: 'white', borderCollapse: 'collapse', borderRadius: '8px', overflow: 'hidden'}}>
                                <thead><tr style={{background: '#f8f9fa', textAlign: 'left'}}><th style={{padding: '15px'}}>Mã Đơn</th><th>Khách hàng</th><th>Tổng tiền</th><th style={{textAlign:'center'}}>Trạng thái</th><th style={{textAlign:'center'}}>Hành động</th></tr></thead>
                                <tbody>
                                    {orders.map(o => (
                                        <tr key={o._id} style={{borderBottom: '1px solid #eee'}}>
                                            <td style={{color:'#0056b3', fontWeight:'bold', padding: '15px'}}>#{o._id.slice(-6).toUpperCase()}</td>
                                            <td>{o.customerName}<br/><small>{o.phone}</small></td>
                                            <td style={{color:'#ee4d2d', fontWeight:'bold'}}>{o.totalPrice.toLocaleString()} đ</td>
                                            <td style={{textAlign:'center'}}><span style={{background: '#fff3cd', color: '#856404', padding: '5px 10px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold'}}>{o.status}</span></td>
                                            <td style={{textAlign:'center'}}><button style={{background:'#0d6efd', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'}} onClick={()=>{setSelectedOrder(o); setOrderStatus(o.status); setIsOrderModalOpen(true);}}>Chi tiết</button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {isOrderModalOpen && selectedOrder && (
                                <div style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000}}>
                                    <div style={{background:'white', padding:'25px', borderRadius:'12px', width:'500px', maxHeight:'90vh', overflowY:'auto'}}>
                                        <h3 style={{marginTop:0, borderBottom:'1px solid #eee', paddingBottom:'10px'}}>Đơn: #{selectedOrder._id.slice(-6).toUpperCase()}</h3>
                                        <div style={{background:'#f8f9fa', padding:'15px', borderRadius:'8px', marginBottom:'15px', fontSize:'0.95rem', lineHeight:'1.6'}}>
                                            <div><strong>Khách hàng:</strong> {selectedOrder.customerName || selectedOrder.user?.name}</div>
                                            <div><strong>SĐT:</strong> {selectedOrder.phone}</div>
                                            <div><strong>Địa chỉ:</strong> {selectedOrder.address}</div>
                                            <div><strong>Thanh toán:</strong> {selectedOrder.paymentMethod} - {selectedOrder.isPaid ? <span style={{color:'green', fontWeight:'bold'}}>Đã trả tiền</span> : <span style={{color:'red', fontWeight:'bold'}}>Chưa trả tiền</span>}</div>
                                        </div>
                                        <div style={{maxHeight:'200px', overflowY:'auto', borderBottom:'1px solid #eee', marginBottom:'15px'}}>
                                            {selectedOrder.orderItems?.map(item => (
                                                <div key={item._id} style={{display:'flex', gap:'10px', marginBottom:'10px', alignItems:'center'}}>
                                                    <img src={item.image?.startsWith('http') ? item.image : `http://localhost:5000${item.image}`} width="50" height="50" style={{objectFit:'contain', border:'1px solid #eee', borderRadius:'4px'}}/>
                                                    <div><div style={{fontWeight:'bold', fontSize:'0.9rem'}}>{item.name}</div><div style={{fontSize:'0.85rem'}}>SL: {item.qty} - <span style={{color:'#ee4d2d'}}>{Number(item.price?.$numberDecimal || item.price).toLocaleString()} đ</span></div></div>
                                                </div>
                                            ))}
                                        </div>
                                        <select value={orderStatus} onChange={e=>setOrderStatus(e.target.value)} style={{width:'100%', padding:'10px', marginBottom:'20px', border: '1px solid #ccc', borderRadius: '4px'}}>
                                            <option value="Chờ xác nhận">Chờ xác nhận</option><option value="Đang đóng gói">Đang đóng gói</option><option value="Đang vận chuyển">Đang vận chuyển</option><option value="Hoàn thành">Hoàn thành (Đã giao)</option><option value="Đã hủy">Hủy đơn</option><option value="Trả hàng">Trả hàng</option>
                                        </select>
                                        <div style={{display:'flex', justifyContent:'flex-end', gap:'10px'}}>
                                            <button style={{background:'#6c757d', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'}} onClick={()=>setIsOrderModalOpen(false)}>Đóng</button>
                                            <button style={{background:'#28a745', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'}} onClick={updateOrderStatusAdmin}>Cập nhật</button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {activeTab === 'seller-requests' && (
                        <table style={{width: '100%', background: 'white', borderCollapse: 'collapse', borderRadius: '8px', overflow: 'hidden'}}>
                            <thead><tr style={{background: '#f8f9fa', textAlign: 'left'}}><th style={{padding: '15px'}}>Khách hàng</th><th>Email</th><th>Trạng thái</th><th style={{textAlign:'center'}}>Hành động</th></tr></thead>
                            <tbody>
                                {requests.map(r => (
                                    <tr key={r._id} style={{borderBottom: '1px solid #eee'}}>
                                        <td style={{padding: '15px'}}><strong>{r.name}</strong></td><td>{r.email}</td><td><span style={{background: '#fff3cd', color: '#856404', padding: '5px 10px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold'}}>Chờ duyệt</span></td>
                                        <td style={{textAlign:'center'}}>
                                            <button style={{background:'#198754', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer', marginRight: '5px', fontWeight: 'bold'}} onClick={()=>handleRequest(r._id, 'approved', r.name)}>Duyệt</button>
                                            <button style={{background:'#dc3545', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'}} onClick={()=>handleRequest(r._id, 'rejected', r.name)}>Từ chối</button>
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
                                    <div style={{flex:1}}><label style={{fontWeight: 'bold', marginBottom: '5px', display: 'block'}}>Mã Voucher</label><input type="text" required style={{width:'100%', padding:'10px', textTransform:'uppercase', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box'}} value={couponForm.code} onChange={e=>setCouponForm({...couponForm, code:e.target.value.toUpperCase()})}/></div>
                                    <div style={{flex:1}}><label style={{fontWeight: 'bold', marginBottom: '5px', display: 'block'}}>Giảm (%)</label><input type="number" required style={{width:'100%', padding:'10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box'}} value={couponForm.discount} onChange={e=>setCouponForm({...couponForm, discount:e.target.value})}/></div>
                                    <div style={{flex:1}}><label style={{fontWeight: 'bold', marginBottom: '5px', display: 'block'}}>Hạn Dùng</label><input type="date" required style={{width:'100%', padding:'10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box'}} value={couponForm.expirationDate} onChange={e=>setCouponForm({...couponForm, expirationDate:e.target.value})}/></div>
                                    
                                    <button type="submit" disabled={isProcessing} style={{background: isProcessing ? '#ccc' : '#ee4d2d', color: 'white', border: 'none', padding:'12px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: isProcessing ? 'not-allowed' : 'pointer'}}>
                                        {isProcessing ? 'ĐANG LƯU...' : 'Lưu Mã'}
                                    </button>
                                </form>
                            </div>
                            <table style={{width: '100%', background: 'white', borderCollapse: 'collapse', borderRadius: '8px', overflow: 'hidden'}}>
                                <thead><tr style={{background: '#f8f9fa', textAlign: 'left'}}><th style={{padding: '15px'}}>Mã Voucher</th><th>Mức giảm</th><th>Hết hạn</th><th style={{textAlign:'center'}}>Thao tác</th></tr></thead>
                                <tbody>
                                    {coupons.map(c => {
                                        const isExpired = new Date(c.expirationDate) < new Date();
                                        return (
                                            <tr key={c._id} style={{borderBottom: '1px solid #eee'}}>
                                                <td style={{fontWeight:'bold', color:'#ee4d2d', padding: '15px'}}>{c.code}</td>
                                                <td style={{fontWeight: 'bold'}}>{c.discount}%</td>
                                                <td>{new Date(c.expirationDate).toLocaleDateString('vi-VN')} {isExpired && <span style={{background: '#e2e3e5', color: '#383d41', padding: '5px 10px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold', marginLeft: '10px'}}>Hết hạn</span>}</td>
                                                <td style={{textAlign:'center'}}><button style={{background:'#dc3545', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'}} onClick={()=>deleteCoupon(c._id)}>Xóa</button></td>
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