import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Typography } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import axiosClient from '../api/axiosClient';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const { data } = await axiosClient.post('/auth/login', values);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      message.success('Cung nghênh Hoàng thượng hồi cung!');
      navigate('/');
    } catch (error) {
        console.error(error);
      message.error('Đăng nhập thất bại! Xin kiểm tra lại mật khẩu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      background: 'linear-gradient(135deg, #1f1c2c 0%, #928dab 100%)' // Màu nền vương giả
    }}>
      <Card bordered={false} style={{ width: 400, boxShadow: '0 10px 25px rgba(0,0,0,0.3)', borderRadius: 12 }}>
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <Title level={2} style={{ color: '#1f1c2c', marginBottom: 0 }}>QUẢN TRỊ</Title>
          <Text type="secondary">Mini Ecommerce System</Text>
        </div>
        
        <Form name="login_form" onFinish={onFinish} layout="vertical" size="large">
          <Form.Item name="email" rules={[{ required: true, message: 'Vui lòng nhập Email!' }]}>
            <Input prefix={<UserOutlined />} placeholder="Email Hoàng cung" />
          </Form.Item>
          
          <Form.Item name="password" rules={[{ required: true, message: 'Vui lòng nhập Mật khẩu!' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block style={{ background: '#1f1c2c', borderColor: '#1f1c2c' }}>
              Đăng Nhập
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Login;