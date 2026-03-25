import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post('http://localhost:5000/api/auth/register', {
        name,
        email,
        password
      });

      localStorage.setItem('registerEmail', email);
      
      Swal.fire({
        title: 'Thành công!',
        text: 'Mã xác thực OTP đã được gửi đến email của bạn.',
        icon: 'success',
        confirmButtonText: 'Nhập OTP ngay',
        allowOutsideClick: false
      }).then(() => {
        navigate('/verify-otp');
      });

    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Không thể kết nối đến máy chủ!';
      Swal.fire('Lỗi đăng ký', errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-box">
        <h2>Tạo Tài Khoản</h2>
        <form onSubmit={handleRegister}>
          
          <div className="form-group">
            <i className="fa-solid fa-user"></i>
            <input 
              type="text" 
              placeholder="Họ và tên đầy đủ" 
              required 
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          
          <div className="form-group">
            <i className="fa-solid fa-envelope"></i>
            <input 
              type="email" 
              placeholder="Địa chỉ Email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div className="form-group">
            <i className="fa-solid fa-lock"></i>
            <input 
              type="password" 
              placeholder="Mật khẩu (tối thiểu 6 ký tự)" 
              required 
              minLength="6"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? (
              <><i className="fa-solid fa-spinner fa-spin"></i> Đang xử lý...</>
            ) : (
              'Đăng ký ngay'
            )}
          </button>
        </form>

        <hr style={{ margin: '25px 0', border: 0, borderTop: '1px solid #eee' }} />

        <div className="auth-links">
          <Link to="/verify-otp" style={{ color: '#28a745', fontWeight: 600 }}>
            <i className="fa-solid fa-shield-halved"></i> Tôi đã có mã xác thực OTP
          </Link>
          <Link to="/login">Đã có tài khoản? <strong>Đăng nhập</strong></Link>
        </div>
      </div>
    </div>
  );
};

export default Register;