import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/products');
        
        // Đề phòng API trả về { products: [...] } thay vì [...]
        if (Array.isArray(res.data)) {
            setProducts(res.data);
        } else if (res.data && Array.isArray(res.data.products)) {
            setProducts(res.data.products);
        } else {
            setProducts([]);
        }
        
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
      <section className="hero-section" style={{ textAlign: 'center', padding: '40px 0', background: '#fff', marginBottom: '20px', borderRadius: '8px' }}>
        <h1 style={{ color: '#ee4d2d', margin: 0 }}>Mini Ecommerce</h1>
        <p style={{ color: '#666' }}>Nền tảng mua sắm tuyệt vời nhất của bạn</p>
      </section>

      <h2 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px' }}>Sản phẩm mới nhất</h2>
      
      {loading ? (
        <p style={{ textAlign: 'center' }}>Đang tải sản phẩm từ Backend...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
          {products.map((product) => (
            <div key={product?._id || Math.random()} style={{ background: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #eee', display: 'flex', flexDirection: 'column' }}>
              
              <img 
                src={product?.images && product.images.length > 0 ? `http://localhost:5000${product.images[0]}` : 'https://via.placeholder.com/200'} 
                alt={product?.name || 'Sản phẩm'} 
                style={{ width: '100%', height: '200px', objectFit: 'contain', marginBottom: '15px' }} 
              />
              
              <h3 style={{ fontSize: '1rem', margin: '0 0 10px', color: '#333', flexGrow: 1 }}>
                {product?.name || 'Chưa có tên'}
              </h3>
              
              <p style={{ color: '#ee4d2d', fontWeight: 'bold', fontSize: '1.2rem', margin: '0 0 15px' }}>
                {product?.price ? Number(product.price).toLocaleString('vi-VN') : '0'} đ
              </p>
              
              <Link to={`/product/${product?._id}`} style={{ background: '#005bae', color: '#fff', textAlign: 'center', padding: '10px', textDecoration: 'none', borderRadius: '5px', fontWeight: 'bold' }}>
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