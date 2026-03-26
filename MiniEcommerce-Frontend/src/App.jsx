import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import VerifyOTP from './pages/VerifyOTP';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import OrderDetail from './pages/OrderDetail';
import Footer from './components/Footer';
import Checkout from './pages/Checkout';
import Seller from './pages/Seller'; 

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
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          <Route path="/profile" element={<Profile />} />
          <Route path="/order/:id" element={<OrderDetail />} />
          <Route path="/checkout" element={<Checkout />} />
          
          <Route path="/seller" element={<Seller />} />
        </Routes>
      </div>
      <Footer />
    </BrowserRouter>
  );
}

export default App;