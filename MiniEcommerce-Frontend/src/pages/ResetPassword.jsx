import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      Swal.fire({
        title: 'Lỗi bảo mật',
        text: 'Đường dẫn không hợp lệ hoặc đã hết hạn!',
        icon: 'error',
        allowOutsideClick: false
      }).then(() => {
        navigate('/login');
      });
    }
  }, [token, navigate]);

  const handleReset = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      Swal.fire('Thất bại', 'Hai mật khẩu không khớp nhau!', 'error');
      return;
    }

    setLoading(true);

    try {
      const res = await axios.put(`http://localhost:5000/api/auth/reset-password/${token}`, { password });
      
      Swal.fire({
        title: 'Hoàn tất!',
        text: 'Mật khẩu của bạn đã được thay đổi an toàn.',
        icon: 'success',
        allowOutsideClick: false
      }).then(() => {
        navigate('/login');
      });
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
        <h2>Tạo Mật Khẩu Mới</h2>
        <form onSubmit={handleReset}>
          <div className="form-group">
            <i className="fa-solid fa-lock"></i>
            <input 
              type="password" 
              placeholder="Nhập mật khẩu mới" 
              required 
              minLength="6"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="form-group">
            <i className="fa-solid fa-circle-check"></i>
            <input 
              type="password" 
              placeholder="Nhập lại mật khẩu mới" 
              required 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <button 
            type="submit" 
            className="btn-submit" 
            style={{ background: '#28a745' }}
            disabled={loading}
          >
            {loading ? <><i className="fa-solid fa-spinner fa-spin"></i> Đang xử lý...</> : 'Cập nhật Mật khẩu'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;