import React, { useState } from 'react';
import { Layout, Menu, Button, theme, Avatar, Dropdown } from 'antd';
import {
  MenuFoldOutlined, MenuUnfoldOutlined, DashboardOutlined,
  ShoppingOutlined, UserOutlined, FileTextOutlined, LogoutOutlined
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

const { Header, Sider, Content } = Layout;

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { token: { colorBgContainer } } = theme.useToken();
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const menuItems = [
    { key: '/', icon: <DashboardOutlined />, label: 'Tổng quan' },
    { key: '/products', icon: <ShoppingOutlined />, label: 'Sản phẩm' },
    { key: '/orders', icon: <FileTextOutlined />, label: 'Đơn hàng' },
    { key: '/users', icon: <UserOutlined />, label: 'Người dùng' },
  ];

  const userMenu = {
    items: [{ key: '1', label: 'Đăng xuất', icon: <LogoutOutlined />, onClick: handleLogout }]
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} style={{ background: '#001529' }}>
        <div style={{ height: 64, margin: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18, fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          {collapsed ? 'ME' : 'MINI ECOM'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: '0 24px', background: colorBgContainer, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px #f0f1f2' }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '16px', width: 64, height: 64 }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontWeight: 500 }}>Xin chào, {user.name || 'Admin'}</span>
            <Dropdown menu={userMenu}>
               <Avatar style={{ backgroundColor: '#f56a00', cursor: 'pointer' }} icon={<UserOutlined />} />
            </Dropdown>
          </div>
        </Header>
        <Content style={{ margin: '24px 16px', padding: 24, background: colorBgContainer, borderRadius: 8, minHeight: 280 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;