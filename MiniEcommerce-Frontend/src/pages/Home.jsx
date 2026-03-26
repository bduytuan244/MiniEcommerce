import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]); 
  const [loading, setLoading] = useState(true);

  const [keyword, setKeyword] = useState('');
  
  const [debouncedKeyword, setDebouncedKeyword] = useState('');

  const [brand, setBrand] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [sort, setSort] = useState('-createdAt');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchBrands = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/products?limit=1000');
      const allProducts = res.data.products || res.data;
      const uniqueBrands = [...new Set(allProducts.map(p => p.brand))].filter(b => b);
      setBrands(uniqueBrands);
    } catch (error) {
      console.error("Lỗi lấy thương hiệu:", error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(keyword);
    }, 500);

    return () => clearTimeout(timer);
  }, [keyword]);

  useEffect(() => {
    setPage(1);
  }, [debouncedKeyword, brand, priceRange, sort]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        let url = `http://localhost:5000/api/products?keyword=${debouncedKeyword}&sort=${sort}&page=${page}`;
        
        if (brand) url += `&brand=${brand}`;
        
        if (priceRange) {
          const [min, max] = priceRange.split('-');
          url += `&minPrice=${min}&maxPrice=${max}`; 
        }

        const res = await axios.get(url);
        setProducts(res.data.products || res.data);
        
        if (res.data.totalPages) {
          setTotalPages(res.data.totalPages);
        } else {
          setTotalPages(1);
        }
      } catch (error) {
        console.error("Lỗi lấy sản phẩm:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [debouncedKeyword, brand, priceRange, sort, page]);

  useEffect(() => {
    fetchBrands();
  }, []);

  return (
    <>
      <div className="hero-banner">
        <h1>Săn Sale Cực Khủng</h1>
        <p>Hàng ngàn sản phẩm công nghệ đang chờ đón bạn</p>
      </div>

      <div className="filter-bar">
        <div className="filter-input-group">
          <i className="fa-solid fa-magnifying-glass"></i>
          <input 
            type="text" 
            placeholder="Tìm sản phẩm..." 
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>

        <select className="filter-select" value={brand} onChange={(e) => setBrand(e.target.value)}>
          <option value="">Thương hiệu (Tất cả)</option>
          {brands.map((b, index) => (
            <option key={index} value={b}>{b}</option>
          ))}
        </select>

        <select className="filter-select" value={priceRange} onChange={(e) => setPriceRange(e.target.value)}>
          <option value="">Mức giá (Tất cả)</option>
          <option value="0-500000">Dưới 500.000đ</option>
          <option value="500000-2000000">500k - 2 Triệu</option>
          <option value="2000000-10000000">2 Triệu - 10 Triệu</option>
          <option value="10000000-999999999">Trên 10 Triệu</option>
        </select>

        <select className="filter-select" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="-createdAt">Mới nhất</option>
          <option value="price">Giá: Thấp đến Cao</option>
          <option value="-price">Giá: Cao đến Thấp</option>
        </select>

      </div>

      <h2 className="section-title">Gợi ý hôm nay</h2>

      <div id="product-list">
        {loading ? (
          <p style={{ textAlign: 'center', width: '100%', fontSize: '1.2rem', color: '#666', padding: '40px 0' }}><i className="fa-solid fa-spinner fa-spin"></i> Đang tải sản phẩm...</p>
        ) : products.length === 0 ? (
          <p style={{ textAlign: 'center', width: '100%', fontSize: '1.2rem', color: '#888', padding: '40px 0' }}>Không tìm thấy sản phẩm phù hợp.</p>
        ) : (
          products.map((item) => {
             const safePrice = typeof item.price === 'object' && item.price?.$numberDecimal 
                ? Number(item.price.$numberDecimal) 
                : Number(item.price || 0);

             const imgSrc = item.images && item.images.length > 0 
                ? (item.images[0].startsWith('http') ? item.images[0] : `http://localhost:5000${item.images[0]}`)
                : 'https://via.placeholder.com/200';

             return (
              <Link to={`/product/${item._id}`} key={item._id} className="product-card" style={{ textDecoration: 'none' }}>
                <img 
                  src={imgSrc} 
                  alt={item.name} 
                  style={{objectFit: 'contain', background: '#fff'}}
                />
                <h3 style={{color: '#333'}}>{item.name}</h3>
                <p className="price">{safePrice.toLocaleString('vi-VN')} đ</p>
                {(item.countInStock === 0 || item.stock === 0) && (
                    <span style={{background: '#dc3545', color: 'white', fontSize: '0.8rem', padding: '3px 8px', borderRadius: '4px', position: 'absolute', top: '10px', left: '10px'}}>Hết hàng</span>
                )}
              </Link>
             )
          })
        )}
      </div>

      <div className="pagination">
          <button 
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{ opacity: page === 1 ? 0.5 : 1, cursor: page === 1 ? 'not-allowed' : 'pointer' }}
          >
            Trước
          </button>
          
          <button className="active">{page} / {totalPages}</button>
          
          <button 
            onClick={() => setPage(p => p + 1)}
            disabled={page >= totalPages}
            style={{ opacity: page >= totalPages ? 0.5 : 1, cursor: page >= totalPages ? 'not-allowed' : 'pointer' }}
          >
            Sau
          </button>
      </div>
    </>
  );
};

export default Home;