import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
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
import Admin from './pages/Admin'; 

const AppLayout = () => {
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/admin') || location.pathname.startsWith('/seller');
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response && error.response.status === 403 && error.response.data?.message?.includes('khóa')) {
          Swal.fire({
            title: 'Tài khoản bị khóa!',
            text: 'Tài khoản của bạn đã bị vô hiệu hóa bởi Quản trị viên.',
            icon: 'error',
            confirmButtonText: 'Đã hiểu',
            allowOutsideClick: false
          }).then(() => {
            localStorage.clear(); 
            window.location.href = '/login'; 
          });
          return Promise.reject(error);
        }
        if (error.response && error.response.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true; 

          const refreshToken = localStorage.getItem('refreshToken') || localStorage.getItem('adminRefreshToken');
          
          if (refreshToken) {
            try {
              const res = await axios.post('http://localhost:5000/api/auth/refresh', { refreshToken });
              const newAccessToken = res.data.accessToken;
              
              if (localStorage.getItem('adminToken')) {
                  localStorage.setItem('adminToken', newAccessToken);
              } else {
                  localStorage.setItem('token', newAccessToken);
              }

              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
              return axios(originalRequest); 

            } catch (refreshError) {
              console.error("Refresh token thất bại, vui lòng đăng nhập lại", refreshError);
              localStorage.clear();
              window.location.href = '/login';
              return Promise.reject(refreshError);
            }
          }
        }

        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  return (
    <>
      {!isDashboard && <Header />}

      <div style={{ minHeight: '80vh' }}>
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
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </div>
      
      {!isDashboard && <Footer />}
    </>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}

export default App;