import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Login from './pages/Login';
import ProductDetail from './pages/ProductDetail';

const CartDummy = () => <div style={{padding: '20px'}}><h1>Giỏ hàng</h1></div>;
const RegisterDummy = () => <div style={{padding: '20px'}}><h1>Đăng ký</h1></div>;
const ProfileDummy = () => <div style={{padding: '20px'}}><h1>Trang cá nhân</h1></div>;
const SellerDummy = () => <div style={{padding: '20px'}}><h1>Kênh người bán</h1></div>;

function App() {
  return (
    <BrowserRouter>
      <Header />

      <div style={{ paddingTop: '70px', minHeight: '80vh' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          
          <Route path="/register" element={<RegisterDummy />} />
          <Route path="/cart" element={<CartDummy />} />
          <Route path="/profile" element={<ProfileDummy />} />
          <Route path="/seller" element={<SellerDummy />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;