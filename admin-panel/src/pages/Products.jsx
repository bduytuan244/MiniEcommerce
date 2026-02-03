import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, message, Space, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import axiosClient from '../api/axiosClient';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form] = Form.useForm();

  // 1. Lấy danh sách sản phẩm từ API
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data } = await axiosClient.get('/products');
      // Backend trả về: { products: [...], count: ... } hoặc mảng trực tiếp tùy API
      // Dựa theo file productController.js của bạn thì nó trả về object có field 'products'
      setProducts(data.products || []); 
    } catch (error) {
        console.error(error);
      message.error('Lỗi tải danh sách sản phẩm!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // 2. Xử lý Thêm / Sửa
  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      
      // Xử lý ảnh: Tách chuỗi link ảnh thành mảng (vì backend lưu mảng)
      if (values.images && typeof values.images === 'string') {
        values.images = values.images.split(',').map(img => img.trim());
      }

      if (editingProduct) {
        // Sửa
        await axiosClient.put(`/products/${editingProduct._id}`, values);
        message.success('Cập nhật thành công!');
      } else {
        // Thêm mới
        await axiosClient.post('/products', values);
        message.success('Thêm sản phẩm thành công!');
      }

      setIsModalOpen(false);
      form.resetFields();
      setEditingProduct(null);
      fetchProducts(); // Load lại bảng
    } catch (error) {
      message.error('Có lỗi xảy ra, vui lòng kiểm tra lại!');
      console.error(error);
    }
  };

  // 3. Xử lý Xóa
  const handleDelete = async (id) => {
    try {
      await axiosClient.delete(`/products/${id}`);
      message.success('Đã xóa sản phẩm!');
      fetchProducts();
    } catch (error) {
        console.error(error);
      message.error('Xóa thất bại!');
    }
  };

  // Mở form thêm mới
  const openAddModal = () => {
    setEditingProduct(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  // Mở form sửa
  const openEditModal = (record) => {
    setEditingProduct(record);
    // Fill dữ liệu cũ vào form
    form.setFieldsValue({
      ...record,
      images: record.images ? record.images.join(', ') : '', // Chuyển mảng ảnh về chuỗi để hiển thị
    });
    setIsModalOpen(true);
  };

  // Cấu hình cột cho bảng
  const columns = [
    {
      title: 'Hình ảnh',
      dataIndex: 'images',
      key: 'images',
      render: (images) => (
        images && images.length > 0 ? 
        <img src={images[0]} alt="product" style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 4 }} /> 
        : <div style={{width: 50, height: 50, background: '#eee', borderRadius: 4}}>No img</div>
      ),
    },
    {
      title: 'Tên sản phẩm',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <b>{text}</b>,
    },
    {
      title: 'Giá',
      dataIndex: 'price',
      key: 'price',
      render: (price) => `${price?.toLocaleString()} đ`,
    },
    {
      title: 'Kho',
      dataIndex: 'stock',
      key: 'stock',
    },
    {
      title: 'Danh mục',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: 'Thương hiệu',
      dataIndex: 'brand',
      key: 'brand',
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button icon={<EditOutlined />} onClick={() => openEditModal(record)} />
          <Popconfirm title="Bạn có chắc muốn xóa?" onConfirm={() => handleDelete(record._id)}>
            <Button icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h2>Quản lý sản phẩm</h2>
        <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchProducts}>Làm mới</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal}>
            Thêm sản phẩm
            </Button>
        </Space>
      </div>

      <Table 
        columns={columns} 
        dataSource={products} 
        rowKey="_id" 
        loading={loading} 
        pagination={{ pageSize: 5 }}
      />

      {/* Modal Form Thêm/Sửa */}
      <Modal
        title={editingProduct ? "Sửa sản phẩm" : "Thêm sản phẩm mới"}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={() => setIsModalOpen(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Tên sản phẩm" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item name="price" label="Giá" rules={[{ required: true }]} style={{ flex: 1 }}>
                <InputNumber style={{ width: '100%' }} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
            </Form.Item>
            <Form.Item name="stock" label="Tồn kho" rules={[{ required: true }]} style={{ flex: 1 }}>
                <InputNumber style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item name="category" label="Danh mục" rules={[{ required: true }]} style={{ flex: 1 }}>
                <Input placeholder="Ví dụ: Quan ao" />
            </Form.Item>
            <Form.Item name="brand" label="Thương hiệu" rules={[{ required: true }]} style={{ flex: 1 }}>
                <Input placeholder="Ví dụ: Nike" />
            </Form.Item>
          </div>

          <Form.Item name="images" label="Link hình ảnh (URL)">
            <Input.TextArea placeholder="Dán link ảnh vào đây (nếu nhiều ảnh thì cách nhau bằng dấu phẩy)" rows={2} />
          </Form.Item>

          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Products;