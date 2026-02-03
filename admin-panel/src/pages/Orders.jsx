import React, { useEffect, useState } from 'react';
import { Table, Tag, Select, message, Space, Card, Typography } from 'antd';
import axiosClient from '../api/axiosClient';

const { Option } = Select;
const { Text } = Typography;

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  // 1. Lấy danh sách đơn hàng
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await axiosClient.get('/orders');
      setOrders(data);
    } catch (error) {
        console.error(error);
      message.error('Không thể tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // 3. Xử lý khi Admin đổi trạng thái
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await axiosClient.put(`/orders/${orderId}/status`, { status: newStatus });
      message.success(`Đã cập nhật: ${newStatus}`);
      fetchOrders(); // Load lại dữ liệu mới
    } catch (error) {
        console.error(error);
      message.error('Cập nhật thất bại!');
    }
  };

  // Cột hiển thị bảng chính
  const columns = [
    {
      title: 'Mã đơn',
      dataIndex: '_id',
      key: '_id',
      render: (text) => <Text copyable>{text.slice(-6).toUpperCase()}</Text>, // Chỉ hiện 6 số cuối cho gọn
    },
    {
      title: 'Khách hàng',
      dataIndex: 'customerName',
      key: 'customerName',
      render: (text, record) => (
        <div>
          <b>{text}</b><br/>
          <Text type="secondary" style={{fontSize: 12}}>{record.phone}</Text>
        </div>
      )
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      render: (price) => <b style={{color: '#d46b08'}}>{price?.toLocaleString()} đ</b>,
    },
    {
      title: 'Ngày đặt',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => (
        <Select 
          defaultValue={status} 
          style={{ width: 160 }} 
          onChange={(value) => handleStatusChange(record._id, value)}
          status={status === 'Đã hủy' ? 'error' : ''}
        >
          <Option value="Chờ xác nhận">Chờ xác nhận</Option>
          <Option value="Đang đóng gói">Đang đóng gói</Option>
          <Option value="Đang vận chuyển">Đang vận chuyển</Option>
          <Option value="Hoàn thành">Hoàn thành</Option>
          <Option value="Đã hủy">Hủy đơn</Option>
        </Select>
      ),
    },
  ];

  // Bảng phụ (Khi bấm dấu + để xem chi tiết sản phẩm trong đơn)
  const expandedRowRender = (record) => {
    const productColumns = [
      { title: 'Sản phẩm', dataIndex: 'name', key: 'name' },
      { title: 'Số lượng', dataIndex: 'qty', key: 'qty' },
      { title: 'Đơn giá', dataIndex: 'price', key: 'price', render: (p) => `${p.toLocaleString()} đ` },
      { title: 'Thành tiền', key: 'total', render: (_, item) => <b>{(item.price * item.qty).toLocaleString()} đ</b> },
    ];
    return <Table columns={productColumns} dataSource={record.orderItems} pagination={false} rowKey="_id" />;
  };

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>Quản lý Đơn hàng</h2>
      <Table
        loading={loading}
        columns={columns}
        dataSource={orders}
        rowKey="_id"
        expandable={{ expandedRowRender }} // Cho phép mở rộng xem chi tiết
      />
    </div>
  );
};

export default Orders;