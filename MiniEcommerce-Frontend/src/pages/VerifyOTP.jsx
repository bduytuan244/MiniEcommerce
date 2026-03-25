import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';

const VerifyOTP = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const savedEmail = localStorage.getItem('registerEmail');
    if (savedEmail) {
      setEmail(savedEmail);
    } else {
      Swal.fire('Lỗi', 'Không tìm thấy thông tin email. Vui lòng đăng ký lại.', 'warning').then(() => {
        navigate('/register');
      });
    }
  }, [navigate]);

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post('http://localhost:5000/api/auth/verify-otp', {
        email,
        otp
      });

      const data = res.data;

      localStorage.setItem('token', data.accessToken);
      if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('userInfo', JSON.stringify(data.user));

      localStorage.removeItem('registerEmail');

      Swal.fire({
        title: 'Thành công!',
        text: 'Tài khoản đã được kích hoạt. Chào mừng bạn!',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      }).then(() => {
        navigate('/');
        window.location.reload(); 
      });

    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Lỗi kết nối Server';
      Swal.fire('Thất bại', errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-box">
        <h2 style={{ marginBottom: '10px' }}>
          <i className="fa-solid fa-shield-check" style={{ color: '#28a745' }}></i> Xác thực tài khoản
        </h2>
        <p style={{ textAlign: 'center', color: '#666', fontSize: '0.9rem', marginBottom: '25px', lineHeight: '1.5' }}>
          Mã xác thực 6 số đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư (hoặc mục Spam).
        </p>
        
        <form onSubmit={handleVerifyOTP}>
          <div className="form-group">
            <i className="fa-solid fa-envelope"></i>
            <input 
              type="email" 
              value={email}
              readOnly 
              style={{ background: '#f9f9f9', color: '#888' }}
            />
          </div>
          
          <div className="form-group">
            <i className="fa-solid fa-key"></i>
            <input 
              type="text" 
              placeholder="Nhập mã OTP 6 số" 
              required 
              maxLength="6" 
              style={{ textAlign: 'center', letterSpacing: '5px', fontWeight: 'bold', fontSize: '1.2rem' }}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
          </div>
          
          <button 
            type="submit" 
            className="btn-submit" 
            style={{ background: '#28a745' }}
            disabled={loading}
          >
            {loading ? (
              <><i className="fa-solid fa-spinner fa-spin"></i> Đang kiểm tra...</>
            ) : (
              'Xác nhận Kích hoạt'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default VerifyOTP;