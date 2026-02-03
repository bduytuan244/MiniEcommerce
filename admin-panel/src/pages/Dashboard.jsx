import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Spin } from 'antd';
import { DollarOutlined, ShoppingCartOutlined, ShopOutlined, TeamOutlined } from '@ant-design/icons';
import axiosClient from '../api/axiosClient';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Gọi API thống kê
    axiosClient.get('/dashboard/stats')
      .then(res => setStats(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ textAlign: 'center', marginTop: 50 }}><Spin size="large" /></div>;

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>Tổng Quan Hệ Thống</h2>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ background: '#fff1f0', borderRadius: 8 }}>
            <Statistic 
              title="Tổng Doanh Thu" 
              value={stats?.totalRevenue} 
              precision={0} 
              prefix={<DollarOutlined />} 
              suffix="₫"
              valueStyle={{ color: '#cf1322' }} 
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ background: '#fff7e6', borderRadius: 8 }}>
            <Statistic title="Đơn Hàng" value={stats?.totalOrders} prefix={<ShoppingCartOutlined />} valueStyle={{ color: '#d46b08' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ background: '#f6ffed', borderRadius: 8 }}>
            <Statistic title="Sản Phẩm" value={stats?.totalProducts} prefix={<ShopOutlined />} valueStyle={{ color: '#389e0d' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ background: '#e6f7ff', borderRadius: 8 }}>
            <Statistic title="Khách Hàng" value={stats?.totalUsers} prefix={<TeamOutlined />} valueStyle={{ color: '#096dd9' }} />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;