// 1. Hàm định dạng tiền tệ VNĐ
function formatMoney(amount) {
    return Number(amount).toLocaleString('vi-VN') + ' đ';
}

// 2. Hàm lấy Header xác thực (gửi kèm Token lên Server)
function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// 3. Hàm kiểm tra trạng thái đăng nhập (Đã sửa để khớp với giao diện Header mới)
function checkLoginState() {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    // Lấy các phần tử trên Header mới
    const loginLink = document.getElementById('login-link');
    const userMenu = document.getElementById('user-menu');
    const userNameDisplay = document.getElementById('user-name-display');

    // Nếu đã đăng nhập -> Ẩn chữ "Đăng nhập", hiện "Tài khoản"
    if (token && userStr && loginLink && userMenu) {
        const user = JSON.parse(userStr);
        
        loginLink.style.display = 'none'; // Giấu nút đăng nhập
        userMenu.style.display = 'flex';  // Hiện khu vực tài khoản
        
        if (userNameDisplay) {
            userNameDisplay.innerText = user.name; // Điền tên thật của khách vào
        }
    }

    // Gọi luôn hàm cập nhật giỏ hàng khi load trang
    updateCartBadge();
}

// 4. Hàm mới: Cập nhật số lượng huy hiệu (badge) trên giỏ hàng
function updateCartBadge() {
    const cartBadge = document.getElementById('cart-badge');
    if (cartBadge) {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        cartBadge.innerText = cart.length; // Điền số lượng món hàng vào vòng tròn đỏ
    }
}

// 5. Hàm đăng xuất (Đổi tên thành logoutUser cho khớp với file header.html)
function logoutUser() {
    if(confirm("Bạn chắc chắn muốn đăng xuất?")) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('cart'); // Xóa giỏ hàng để bảo mật
        
        window.location.href = '../auth/login.html';
    }
}