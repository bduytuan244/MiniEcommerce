import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const Home = () => {
  // Biến lưu trữ danh sách sản phẩm
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Gọi API ngay khi trang vừa load xong
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/products');
        setProducts(res.data);
        setLoading(false);
      } catch (error) {
        console.error("Lỗi lấy dữ liệu:", error);
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <div className="container">
      {/* 1. Phần Banner */}
      <section className="hero-section" style={{ textAlign: 'center', padding: '40px 0', background: '#fff', marginBottom: '20px', borderRadius: '8px' }}>
        <h1 style={{ color: '#ee4d2d', margin: 0 }}>Mini Ecommerce</h1>
        <p style={{ color: '#666' }}>Nền tảng mua sắm tuyệt vời nhất của bạn</p>
      </section>

      {/* 2. Danh sách sản phẩm */}
      <h2 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px' }}>Sản phẩm mới nhất</h2>
      
      {loading ? (
        <p style={{ textAlign: 'center' }}>Đang tải sản phẩm...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
          
          {/* Lặp qua mảng products để vẽ ra từng thẻ sản phẩm */}
          {products.map(product => (
            <div key={product._id} style={{ background: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #eee', display: 'flex', flexDirection: 'column' }}>
              
              {/* Ảnh sản phẩm: Lấy url từ backend */}
              <img 
                src={product.images && product.images[0] ? `http://localhost:5000${product.images[0]}` : 'https://via.placeholder.com/200'} 
                alt={product.name} 
                style={{ width: '100%', height: '200px', objectFit: 'contain', marginBottom: '15px' }} 
              />
              
              <h3 style={{ fontSize: '1rem', margin: '0 0 10px', color: '#333', flexGrow: 1 }}>{product.name}</h3>
              <p style={{ color: '#ee4d2d', fontWeight: 'bold', fontSize: '1.2rem', margin: '0 0 15px' }}>
                {Number(product.price).toLocaleString('vi-VN')} đ
              </p>
              
              {/* Nút xem chi tiết chuyển hướng sang trang Product Detail */}
              <Link to={`/product/${product._id}`} style={{ background: '#005bae', color: '#fff', textAlign: 'center', padding: '10px', textDecoration: 'none', borderRadius: '5px', fontWeight: 'bold' }}>
                Xem chi tiết
              </Link>
            </div>
          ))}
          
        </div>
      )}
    </div>
  );
};

export default Home;