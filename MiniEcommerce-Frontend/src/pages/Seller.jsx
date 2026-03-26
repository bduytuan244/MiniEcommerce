import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';

const Seller = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [shopName, setShopName] = useState('...');
    const [editProductId, setEditProductId] = useState(null);

    const [isProcessing, setIsProcessing] = useState(false);

    const [dashboardData, setDashboardData] = useState({ totalProducts: 0, totalOrders: 0 });
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    
    const [productPage, setProductPage] = useState(1);
    const [productTotalPages, setProductTotalPages] = useState(1);
    const [orderPage, setOrderPage] = useState(1);
    const [orderTotalPages, setOrderTotalPages] = useState(1);

    const [categories, setCategories] = useState([]);

    const [formData, setFormData] = useState({ name: '', price: '', countInStock: 0, brand: '', category: '', description: '' });
    const fileInputRef = useRef(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('userInfo'));

        if (!token || !user) {
            navigate('/login');
            return;
        }
        if (!user.isSeller && !user.isAdmin) {
            Swal.fire('Từ chối', 'Bạn chưa đăng ký quyền Người bán!', 'error').then(() => navigate('/'));
            return;
        }
        setShopName(user.name);
        fetchDashboardData();
    }, [navigate]);

    useEffect(() => {
        if (activeTab === 'dashboard') fetchDashboardData();
        if (activeTab === 'products') fetchProducts();
        if (activeTab === 'orders') fetchOrders();
        if (activeTab === 'add-product') {
            fetchCategories(); 
            if (editProductId) {
                fetchProductDetail(editProductId);
            } else {
                setFormData({ name: '', price: '', countInStock: 0, brand: '', category: '', description: '' });
            }
        }
    }, [activeTab, editProductId, productPage, orderPage]);

    const getAuthHeader = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

    const fetchDashboardData = async () => {
        try {
            const [resProd, resOrder] = await Promise.all([
                axios.get('http://localhost:5000/api/products/myshop?limit=10000', getAuthHeader()),
                axios.get('http://localhost:5000/api/orders/myshop?limit=10000', getAuthHeader())
            ]);
            setDashboardData({
                totalProducts: resProd.data.totalProducts || resProd.data.products?.length || 0,
                totalOrders: resOrder.data.totalOrders || resOrder.data.orders?.length || resOrder.data?.length || 0
            });
        } catch (error) { console.error("Lỗi tải dashboard", error); }
    };

    const fetchProducts = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/products/myshop?page=${productPage}&limit=5`, getAuthHeader());
            setProducts(res.data.products || []);
            setProductTotalPages(res.data.totalPages || 1);
        } catch (error) { console.error("Lỗi tải sản phẩm", error); }
    };

    const fetchOrders = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/orders/myshop?page=${orderPage}&limit=5`, getAuthHeader());
            setOrders(res.data.orders || res.data || []);
            setOrderTotalPages(res.data.totalPages || 1);
        } catch (error) { console.error("Lỗi tải đơn hàng", error); }
    };

    const fetchProductDetail = async (id) => {
        try {
            const res = await axios.get(`http://localhost:5000/api/products/${id}`);
            const p = res.data;
            setFormData({ ...p, countInStock: p.countInStock || p.stock || 0 });
        } catch (error) { console.error("Lỗi tải chi tiết SP", error); }
    };

    const fetchCategories = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/categories'); 
            setCategories(res.data);
        } catch (error) {
            console.error("Lỗi tải danh mục", error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userInfo');
        navigate('/login');
    };

    const handleDeleteProduct = async (id) => {
        const result = await Swal.fire({title: 'Xóa sản phẩm?', text: "Khách hàng sẽ không thể mua sản phẩm này nữa.", icon: 'warning', showCancelButton: true, confirmButtonColor: '#dc3545', cancelButtonText: 'Hủy', confirmButtonText: 'Đồng ý xóa'});
        if (result.isConfirmed) {
            try {
                await axios.delete(`http://localhost:5000/api/products/${id}`, getAuthHeader());
                Swal.fire('Thành công', 'Đã xóa sản phẩm', 'success');
                if (products.length === 1 && productPage > 1) setProductPage(p => p - 1);
                else fetchProducts();
            } catch (error) { Swal.fire('Lỗi', 'Không thể xóa', 'error'); }
        }
    };

    const handleUpdateOrderStatus = async (id, status) => {
        try {
            await axios.put(`http://localhost:5000/api/orders/${id}/status`, { status }, getAuthHeader());
            Swal.fire({ title: 'Thành công', icon: 'success', timer: 1500, showConfirmButton: false });
            fetchOrders();
        } catch (error) { Swal.fire('Lỗi', error.response?.data?.message || 'Lỗi cập nhật', 'error'); }
    };

    const handleSaveProduct = async (e) => {
        e.preventDefault();
        if (isProcessing) return; 
        
        setIsProcessing(true); 
        Swal.fire({ title: 'Đang xử lý...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        
        try {
            const files = fileInputRef.current.files;
            
            if (!editProductId && files.length === 0) {
                Swal.fire('Lỗi', 'Vui lòng chọn ít nhất 1 ảnh!', 'warning');
                setIsProcessing(false);
                return;
            }

            const form = new FormData();
            form.append('name', formData.name);
            form.append('price', formData.price);
            form.append('countInStock', formData.countInStock); 
            form.append('brand', formData.brand);
            form.append('category', formData.category);
            form.append('description', formData.description);
            
            if (files.length > 0) {
                for (let i = 0; i < files.length; i++) {
                    form.append('images', files[i]);
                }
            }

            const url = editProductId ? `http://localhost:5000/api/products/${editProductId}` : 'http://localhost:5000/api/products';
            const method = editProductId ? 'put' : 'post';

            await axios[method](url, form, getAuthHeader());
            
            Swal.fire('Thành công!', 'Lưu sản phẩm thành công.', 'success');
            setEditProductId(null);
            setActiveTab('products');
            setProductPage(1); 
        } catch (error) {
            Swal.fire('Lỗi', error.response?.data?.message || 'Lỗi lưu sản phẩm', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="seller-layout" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', zIndex: 99 }}>
            <div className="seller-sidebar">
                <h2 onClick={() => navigate('/')} title="Về trang mua sắm"><i className="fa-solid fa-store"></i> SELLER CENTER</h2>
                <ul className="seller-menu">
                    <li className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}><i className="fa-solid fa-chart-line"></i> Bảng điều khiển</li>
                    
                    <li className={activeTab === 'products' || activeTab === 'add-product' ? 'active' : ''} onClick={() => {setEditProductId(null); setActiveTab('products'); setProductPage(1);}}><i className="fa-solid fa-box"></i> Kho sản phẩm</li>
                    <li className={activeTab === 'orders' ? 'active' : ''} onClick={() => {setActiveTab('orders'); setOrderPage(1);}}><i className="fa-solid fa-clipboard-list"></i> Quản lý đơn hàng</li>
                    
                    <li style={{marginTop: '15px', borderTop: '1px dashed #ddd', paddingTop: '5px', color: '#0d6efd'}} onClick={() => navigate('/')}>
                        <i className="fa-solid fa-house-user"></i> Về trang mua sắm
                    </li>
                </ul>
                <div className="seller-logout" onClick={handleLogout}>Đăng xuất</div>
            </div>

            <div className="seller-main">
                <div className="seller-topbar">
                    <h3 style={{margin: 0, color: '#555'}}>{activeTab === 'dashboard' ? 'Tổng quan Cửa hàng' : activeTab === 'orders' ? 'Quản lý Đơn hàng' : 'Quản lý Sản phẩm'}</h3>
                    <div style={{fontWeight: 600, color: '#333'}}><i className="fa-solid fa-shop" style={{color: '#ee4d2d', marginRight: '5px'}}></i> Shop: <strong>{shopName}</strong></div>
                </div>
                <div className="seller-content">
                    {activeTab === 'dashboard' && (
                        <>
                            <div className="seller-stat-cards">
                                <div className="seller-card"><h3><i className="fa-solid fa-boxes-stacked"></i> Sản phẩm đang bán</h3><p>{dashboardData.totalProducts}</p></div>
                                <div className="seller-card"><h3><i className="fa-solid fa-bag-shopping"></i> Đơn hàng nhận được</h3><p>{dashboardData.totalOrders}</p></div>
                            </div>
                            <div className="seller-welcome">
                                <h3>Chào mừng đến với Kênh Người Bán!</h3>
                                <p style={{lineHeight: 1.6}}>Tại đây, bạn có toàn quyền quản lý cửa hàng của mình. Hãy bắt đầu đăng tải sản phẩm mới để tiếp cận hàng ngàn khách hàng trên hệ thống Mini Ecommerce nhé.</p>
                            </div>
                        </>
                    )}

                    {activeTab === 'products' && (
                        <>
                            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '20px'}}>
                                <h2 style={{margin: 0}}>Sản phẩm của Shop</h2>
                                <button className="btn-seller btn-add" onClick={() => { setEditProductId(null); setActiveTab('add-product'); }}>
                                    <i className="fa-solid fa-plus"></i> Đăng sản phẩm mới
                                </button>
                            </div>
                            <table className="seller-table">
                                <thead><tr><th>Ảnh</th><th>Tên sản phẩm</th><th>Giá bán</th><th style={{textAlign:'center'}}>Kho</th><th style={{textAlign:'center'}}>Hành động</th></tr></thead>
                                <tbody>
                                    {products.length === 0 ? <tr><td colSpan="5" style={{textAlign:'center'}}>Chưa có sản phẩm nào.</td></tr> : 
                                        products.map(p => (
                                            <tr key={p._id}>
                                                <td style={{padding: '10px'}}><img src={p.images?.[0]?.startsWith('http') ? p.images[0] : `http://localhost:5000${p.images?.[0]}`} width="50" height="50" style={{objectFit:'contain', borderRadius:'6px', border:'1px solid #eee', background:'white'}} /></td>
                                                <td><strong>{p.name}</strong></td>
                                                <td style={{color:'#ee4d2d', fontWeight:'bold'}}>{Number(p.price || p.price?.$numberDecimal || 0).toLocaleString('vi-VN')} đ</td>
                                                <td style={{textAlign:'center'}}><span style={{padding: '4px 10px', borderRadius: '12px', background: p.countInStock > 0 || p.stock > 0 ? '#e6f4ea' : '#f8d7da', color: p.countInStock > 0 || p.stock > 0 ? '#1e7e34' : '#721c24', fontWeight: 'bold'}}>{p.countInStock || p.stock || 0}</span></td>
                                                <td style={{textAlign:'center'}}>
                                                    <button className="btn-seller btn-edit" style={{marginRight: '5px'}} onClick={() => { setEditProductId(p._id); setActiveTab('add-product'); }}><i className="fa-solid fa-pen"></i></button>
                                                    <button className="btn-seller btn-delete" onClick={() => handleDeleteProduct(p._id)}><i className="fa-solid fa-trash"></i></button>
                                                </td>
                                            </tr>
                                        ))
                                    }
                                </tbody>
                            </table>
                            
                            {productTotalPages > 1 && (
                                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginTop: '20px' }}>
                                    <button 
                                        className="btn-seller" 
                                        style={{background: '#6c757d', padding: '8px 15px', opacity: productPage === 1 ? 0.5 : 1, cursor: productPage === 1 ? 'not-allowed' : 'pointer'}} 
                                        disabled={productPage === 1} 
                                        onClick={() => setProductPage(p => p - 1)}
                                    ><i className="fa-solid fa-chevron-left"></i> Trước</button>
                                    
                                    <span style={{fontWeight: 'bold', color: '#555'}}>Trang {productPage} / {productTotalPages}</span>
                                    
                                    <button 
                                        className="btn-seller" 
                                        style={{background: '#6c757d', padding: '8px 15px', opacity: productPage >= productTotalPages ? 0.5 : 1, cursor: productPage >= productTotalPages ? 'not-allowed' : 'pointer'}} 
                                        disabled={productPage >= productTotalPages} 
                                        onClick={() => setProductPage(p => p + 1)}
                                    >Sau <i className="fa-solid fa-chevron-right"></i></button>
                                </div>
                            )}
                        </>
                    )}

                    {activeTab === 'add-product' && (
                        <div className="seller-form-container">
                            <h2 style={{textAlign:'center', marginTop:0}}>{editProductId ? 'CẬP NHẬT SẢN PHẨM' : 'ĐĂNG BÁN SẢN PHẨM'}</h2>
                            <form onSubmit={handleSaveProduct}>
                                <div className="seller-form-group"><label>Tên sản phẩm</label><input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
                                <div style={{display:'flex', gap:'20px'}}>
                                    <div className="seller-form-group" style={{flex:1}}><label>Giá bán (VNĐ)</label><input type="number" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} /></div>
                                    <div className="seller-form-group" style={{flex:1}}><label>Số lượng kho</label><input type="number" required value={formData.countInStock} onChange={e => setFormData({...formData, countInStock: e.target.value})} /></div>
                                </div>
                                <div style={{display:'flex', gap:'20px'}}>
                                    <div className="seller-form-group" style={{flex:1}}><label>Thương hiệu</label><input type="text" required value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} /></div>
                                    <div className="seller-form-group" style={{flex:1}}>
                                        <label>Danh mục</label>
                                        <select required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} style={{width:'100%', padding:'10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box'}}>
                                            <option value="">-- Chọn danh mục --</option>
                                            {categories.map(c => (
                                                <option key={c._id} value={c.name}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="seller-form-group">
                                    <label>Ảnh sản phẩm</label>
                                    <div className="seller-file-upload">
                                        <i className="fa-solid fa-cloud-arrow-up" style={{fontSize:'2rem', color:'#ee4d2d', marginBottom:'10px'}}></i><br/>
                                        <input type="file" ref={fileInputRef} accept="image/*" multiple />
                                    </div>
                                    <small style={{color:'#888'}}>* Nếu sửa sản phẩm mà không chọn ảnh mới, hệ thống sẽ giữ lại ảnh cũ.</small>
                                </div>
                                <div className="seller-form-group"><label>Mô tả chi tiết</label><textarea rows="5" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea></div>
                                <div style={{textAlign:'center'}}>
                                    <button 
                                        type="submit" 
                                        disabled={isProcessing}
                                        className="btn-seller btn-add"
                                        style={{ opacity: isProcessing ? 0.7 : 1, cursor: isProcessing ? 'not-allowed' : 'pointer' }}
                                    >
                                        {isProcessing ? 'Đang lưu...' : (editProductId ? 'Lưu cập nhật' : 'Đăng bán ngay')}
                                    </button>
                                    <button type="button" className="btn-seller" style={{background:'#6c757d', marginLeft:'15px'}} onClick={() => { setEditProductId(null); setActiveTab('products'); }}>Hủy</button>
                                </div>
                            </form>
                        </div>
                    )}

                    {activeTab === 'orders' && (
                        <>
                            <h2 style={{marginTop: 0}}>Đơn hàng chờ xử lý</h2>
                            <table className="seller-table">
                                <thead><tr><th>Mã đơn</th><th>Người mua</th><th>Ngày đặt</th><th style={{textAlign:'center'}}>Trạng thái</th><th style={{textAlign:'center'}}>Hành động</th></tr></thead>
                                <tbody>
                                    {orders.length === 0 ? <tr><td colSpan="5" style={{textAlign:'center'}}>Shop chưa có đơn hàng nào.</td></tr> : 
                                        orders.map(o => (
                                            <tr key={o._id}>
                                                <td style={{fontWeight:'bold', color:'#0d6efd'}}>#{o._id.slice(-6).toUpperCase()}</td>
                                                <td><div>{o.customerName || o.user?.name || 'N/A'}</div><small style={{color:'#666'}}>{o.phone || ''}</small></td>
                                                <td>{new Date(o.createdAt).toLocaleDateString('vi-VN')}</td>
                                                <td style={{textAlign:'center'}}>
                                                    <span className={`seller-badge ${o.status === 'Chờ xác nhận' ? 'badge-pending' : o.status === 'Đang đóng gói' ? 'badge-processing' : o.status === 'Đang vận chuyển' ? 'badge-shipped' : o.status === 'Hoàn thành' ? 'badge-completed' : 'badge-cancelled'}`}>
                                                        {o.status}
                                                    </span>
                                                </td>
                                                <td style={{textAlign:'center'}}>
                                                    {o.status === 'Chờ xác nhận' && <button className="btn-seller btn-pack" onClick={() => handleUpdateOrderStatus(o._id, 'Đang đóng gói')}><i className="fa-solid fa-box-open"></i> Chuẩn bị</button>}
                                                    {o.status === 'Đang đóng gói' && <button className="btn-seller btn-ship" onClick={() => handleUpdateOrderStatus(o._id, 'Đang vận chuyển')}><i className="fa-solid fa-truck-fast"></i> Giao ĐVVC</button>}
                                                    {o.status === 'Đang vận chuyển' && <span style={{color:'#6c757d', fontStyle:'italic'}}>Đang giao...</span>}
                                                    {o.status === 'Hoàn thành' && <span style={{color:'#198754', fontWeight:'bold'}}><i className="fa-solid fa-check"></i> Xong</span>}
                                                    {(o.status === 'Đã hủy' || o.status === 'Trả hàng') && <span style={{color:'#dc3545', fontWeight:'bold'}}><i className="fa-solid fa-ban"></i> Đã hủy</span>}
                                                </td>
                                            </tr>
                                        ))
                                    }
                                </tbody>
                            </table>
                            
                            {orderTotalPages > 1 && (
                                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginTop: '20px' }}>
                                    <button 
                                        className="btn-seller" 
                                        style={{background: '#6c757d', padding: '8px 15px', opacity: orderPage === 1 ? 0.5 : 1, cursor: orderPage === 1 ? 'not-allowed' : 'pointer'}} 
                                        disabled={orderPage === 1} 
                                        onClick={() => setOrderPage(p => p - 1)}
                                    ><i className="fa-solid fa-chevron-left"></i> Trước</button>
                                    
                                    <span style={{fontWeight: 'bold', color: '#555'}}>Trang {orderPage} / {orderTotalPages}</span>
                                    
                                    <button 
                                        className="btn-seller" 
                                        style={{background: '#6c757d', padding: '8px 15px', opacity: orderPage >= orderTotalPages ? 0.5 : 1, cursor: orderPage >= orderTotalPages ? 'not-allowed' : 'pointer'}} 
                                        disabled={orderPage >= orderTotalPages} 
                                        onClick={() => setOrderPage(p => p + 1)}
                                    >Sau <i className="fa-solid fa-chevron-right"></i></button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Seller;