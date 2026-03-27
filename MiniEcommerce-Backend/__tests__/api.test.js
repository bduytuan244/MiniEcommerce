const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');

beforeAll(() => {
  process.env.NODE_ENV = 'test';
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('MINI E-COMMERCE API TESTING', () => {

  // TEST 1: Lấy danh sách sản phẩm (Product List)
  it('1. GET /api/products - Nên trả về danh sách sản phẩm và phân trang', async () => {
    const res = await request(app).get('/api/products');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('products');
    expect(res.body).toHaveProperty('totalPages');
    expect(res.body).toHaveProperty('currentPage');
  });

  // TEST 2: Kiểm tra bảo mật truy cập trái phép (Unauthorized Access)
  it('2. GET /api/orders/myorders - Nên chặn (Lỗi 401) nếu không có Token', async () => {
    const res = await request(app).get('/api/orders/myorders');
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toContain('Không tìm thấy Token xác thực'); // <--- Sửa chữ ở đây
  });

  // TEST 3: Kiểm tra Validation Đăng nhập sai định dạng
  it('3. POST /api/auth/login - Nên báo lỗi 400 nếu Email sai định dạng (Joi Validation)', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'not-an-email',
      password: 'password123'
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain('Định dạng email không hợp lệ');
  });

  // TEST 4: Kiểm tra Validation Đăng ký thiếu thông tin
  it('4. POST /api/auth/register - Nên báo lỗi 400 nếu thiếu thông tin bắt buộc (Joi Validation)', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'test@example.com' // Cố tình thiếu name và password
    });
    expect(res.statusCode).toBe(400);
    // Có thể báo lỗi thiếu tên hoặc mật khẩu
    expect(res.body.message).toBeTruthy(); 
  });

  // TEST 5: Bắt lỗi Params (ID MongoDB không hợp lệ)
  it('5. GET /api/products/:id - Nên báo lỗi 400 nếu ID trên URL không phải 24 ký tự Hex', async () => {
    const res = await request(app).get('/api/products/id-linh-tinh');
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain('ID không hợp lệ');
  });

  // TEST 6: Bắt lỗi 404 cho Sản phẩm không tồn tại (Nhưng ID hợp lệ)
  it('6. GET /api/products/:id - Nên báo lỗi 404 nếu sản phẩm không có trong Database', async () => {
    const fakeValidId = new mongoose.Types.ObjectId(); // Tạo 1 ID MongoDB hợp lệ nhưng không có thật
    const res = await request(app).get(`/api/products/${fakeValidId}`);
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toContain('Không tìm thấy sản phẩm');
  });

});