import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';

const VerifyOTPDummy = () => <div style={{padding: '50px', textAlign: 'center'}}><h1>Nhập mã OTP</h1></div>;
const ForgotPasswordDummy = () => <div style={{padding: '50px', textAlign: 'center'}}><h1>Quên mật khẩu</h1></div>;
const ResetPasswordDummy = () => <div style={{padding: '50px', textAlign: 'center'}}><h1>Đặt lại mật khẩu</h1></div>;
const ProfileDummy = () => <div style={{padding: '50px', textAlign: 'center'}}><h1>Trang cá nhân / Checkout</h1></div>;
const SellerDummy = () => <div style={{padding: '50px', textAlign: 'center'}}><h1>Kênh người bán</h1></div>;

function App() {
  return (
    <BrowserRouter>
      <Header />
      <div style={{ paddingTop: '70px', minHeight: '80vh' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-otp" element={<VerifyOTPDummy />} />
          <Route path="/forgot-password" element={<ForgotPasswordDummy />} />
          <Route path="/reset-password" element={<ResetPasswordDummy />} />
          
          <Route path="/profile" element={<ProfileDummy />} />
          <Route path="/seller" element={<SellerDummy />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;