import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault(); 
    setLoading(true);

    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password
      });

      const data = res.data;

      localStorage.setItem('token', data.accessToken);
      if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('userInfo', JSON.stringify(data.user)); 

      if (data.user.isAdmin) {
        localStorage.setItem('adminToken', data.accessToken);
        localStorage.setItem('adminUser', JSON.stringify(data.user));
        window.location.href = 'http://localhost:5000/admin-panel/index.html'; 
      } else {
        navigate('/');
        window.location.reload();
      }

    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Không thể kết nối đến máy chủ!';
      Swal.fire('Lỗi đăng nhập', errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-box">
        <h2>Đăng Nhập</h2>
        <form onSubmit={handleLogin}>
          
          <div className="form-group">
            <i className="fa-solid fa-envelope"></i>
            <input 
              type="email" 
              placeholder="Nhập email của bạn" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)} 
            />
          </div>
          
          <div className="form-group">
            <i className="fa-solid fa-lock"></i>
            <input 
              type="password" 
              placeholder="Mật khẩu" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? (
              <><i className="fa-solid fa-spinner fa-spin"></i> Đang xử lý...</>
            ) : (
              <><i className="fa-solid fa-right-to-bracket"></i> Đăng nhập</>
            )}
          </button>
        </form>
        
        <div className="auth-links">
          <Link to="/forgot-password">Quên mật khẩu?</Link>
          <Link to="/register">Chưa có tài khoản? <strong>Đăng ký ngay</strong></Link>
        </div>
      </div>
    </div>
  );
};

export default Login;