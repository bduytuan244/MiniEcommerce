import React, { useEffect, useState } from 'react';
import { Table, Button, Tag, message, Popconfirm, Avatar } from 'antd';
import { UserOutlined, DeleteOutlined, ShieldClassName } from '@ant-design/icons'; // Chỉnh lại icon nếu cần
import axiosClient from '../api/axiosClient';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // 1. Lấy danh sách user
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await axiosClient.get('/users');
      setUsers(data);
    } catch (error) {
        console.error(error);
      message.error('Lỗi tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 2. Xóa user
  const handleDelete = async (id) => {
    try {
      await axiosClient.delete(`/users/${id}`);
      message.success('Đã xóa người dùng!');
      fetchUsers();
    } catch (error) {
      // Backend chặn không cho tự xóa chính mình -> sẽ báo lỗi ở đây
      message.error(error.response?.data?.message || 'Xóa thất bại!');
    }
  };

  const columns = [
    {
      title: 'Avatar',
      key: 'avatar',
      render: () => <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#87d068' }} />,
    },
    {
      title: 'Họ tên',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <b>{text}</b>,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Vai trò',
      dataIndex: 'isAdmin',
      key: 'isAdmin',
      render: (isAdmin) => (
        isAdmin 
          ? <Tag color="red">ADMIN</Tag> 
          : <Tag color="blue">KHACH HANG</Tag>
      ),
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Popconfirm 
          title="Xóa người dùng này?" 
          description="Hành động này không thể hoàn tác!"
          onConfirm={() => handleDelete(record._id)}
          okText="Xóa"
          cancelText="Hủy"
        >
          <Button danger icon={<DeleteOutlined />} disabled={record.isAdmin}>Xóa</Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>Danh sách Người dùng</h2>
      <Table 
        columns={columns} 
        dataSource={users} 
        rowKey="_id" 
        loading={loading} 
      />
    </div>
  );
};

export default Users;