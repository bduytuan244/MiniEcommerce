import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleForgot = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post('http://localhost:5000/api/auth/forgot-password', { email });
      Swal.fire('Đã gửi thành công!', 'Vui lòng kiểm tra hộp thư (cả mục Spam) để lấy link đổi mật khẩu.', 'success');
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Lỗi kết nối Server!';
      Swal.fire('Lỗi', errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-box">
        <h2 style={{ marginBottom: '10px' }}>Quên Mật Khẩu?</h2>
        <p style={{ textAlign: 'center', color: '#666', fontSize: '0.9rem', marginBottom: '25px', lineHeight: '1.5' }}>
          Vui lòng nhập email đăng nhập của bạn, chúng tôi sẽ gửi liên kết khôi phục mật khẩu an toàn.
        </p>
        
        <form onSubmit={handleForgot}>
          <div className="form-group">
            <i className="fa-solid fa-envelope"></i>
            <input 
              type="email" 
              placeholder="Nhập địa chỉ email..." 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button 
            type="submit" 
            className="btn-submit" 
            style={{ background: '#ffc107', color: '#333' }}
            disabled={loading}
          >
            {loading ? <><i className="fa-solid fa-spinner fa-spin"></i> Đang gửi...</> : 'Gửi yêu cầu khôi phục'}
          </button>
        </form>

        <Link to="/login" style={{ textAlign: 'center', marginTop: '20px', display: 'block', color: '#555', textDecoration: 'none', fontSize: '0.95rem' }}>
          <i className="fa-solid fa-arrow-left"></i> Quay lại Đăng nhập
        </Link>
      </div>
    </div>
  );
};

export default ForgotPassword;