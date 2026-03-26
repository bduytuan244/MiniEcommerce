import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="main-footer">
      <div className="footer-content">
        <div className="footer-col">
          <h3 style={{ color: '#ee4d2d' }}>
            <i className="fa-solid fa-store"></i> Mini Shop
          </h3>
          <p>
            Nền tảng thương mại điện tử tốt nhất dành cho bạn. Mua sắm dễ dàng, thanh toán tiện lợi, giao hàng thần tốc.
          </p>
        </div>
        
        <div className="footer-col">
          <h3>Chăm sóc khách hàng</h3>
          <ul>
            <li><Link to="#"><i className="fa-solid fa-chevron-right" style={{ fontSize: '0.8em' }}></i> Trung tâm trợ giúp</Link></li>
            <li><Link to="#"><i className="fa-solid fa-chevron-right" style={{ fontSize: '0.8em' }}></i> Hướng dẫn mua hàng</Link></li>
            <li><Link to="#"><i className="fa-solid fa-chevron-right" style={{ fontSize: '0.8em' }}></i> Chính sách đổi trả</Link></li>
            <li><Link to="#"><i className="fa-solid fa-chevron-right" style={{ fontSize: '0.8em' }}></i> Chính sách bảo mật</Link></li>
          </ul>
        </div>

        <div className="footer-col">
          <h3>Kết nối với chúng tôi</h3>
          <div className="social-icons">
            <a href="https://www.facebook.com/MixiGaming" target="_blank" rel="noreferrer" style={{ color: 'white', fontSize: '1.5rem' }}>
              <i className="fa-brands fa-facebook"></i>
            </a>
            <a href="https://www.youtube.com/@MixiGaming3con" target="_blank" rel="noreferrer" style={{ color: 'white', fontSize: '1.5rem' }}>
              <i className="fa-brands fa-youtube"></i>
            </a>
          </div>
          <p style={{ marginTop: '15px' }}><i className="fa-solid fa-envelope"></i> anhdomixi@bamia.com</p>
          <p><i className="fa-solid fa-phone"></i> 1900 1234</p>
        </div>
      </div>
      <div className="footer-bottom">
        &copy; 2026 - All rights reserved. Designed by Tuan.
      </div>
    </footer>
  );
};

export default Footer;