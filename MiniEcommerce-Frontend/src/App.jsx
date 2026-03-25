import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Header from './components/Header';
import Login from './pages/Login';

const Cart = () => <div style={{padding: '20px'}}><h1>Giỏ Hàng</h1></div>;
const ProductDetail = () => <div style={{padding: '20px'}}><h1>Chi Tiết Sản Phẩm</h1></div>;

function App() {
  return (
    <Router>
      <Header /> 

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/product/:id" element={<ProductDetail />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;