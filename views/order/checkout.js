document.addEventListener('DOMContentLoaded', () => {
    // 1. Kiểm tra đăng nhập (Bắt buộc phải có token mới được mua)
    const token = localStorage.getItem('token');
    if (!token) {
        alert('⚠️ Bạn cần đăng nhập để tiến hành thanh toán!');
        window.location.href = '../auth/login.html';
        return; // Dừng lại không chạy code bên dưới nữa
    }

    // Load Header & Footer
    fetch('../layouts/header.html').then(res => res.text()).then(html => {
        document.getElementById('header').innerHTML = html;
        checkLoginState(); // Hàm này từ utils.js
    });
    fetch('../layouts/footer.html').then(res => res.text()).then(html => {
        document.getElementById('footer').innerHTML = html;
    });

    // 2. Load Giỏ hàng
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart.length === 0) {
        alert('Giỏ hàng của bạn đang trống!');
        window.location.href = '../home/index.html';
        return;
    }

    // Tự động điền tên người dùng nếu đã lưu trong localStorage
    const userStr = localStorage.getItem('user');
    if(userStr) {
        const userData = JSON.parse(userStr);
        document.getElementById('shippingName').value = userData.name || '';
    }

    // Tạm thời lấy tổng tiền từ localStorage (đã lưu ở trang cart.js)
    // Thực tế chuẩn nhất là backend sẽ tự tính lại tổng tiền dựa trên ID sản phẩm
    const totalAmount = localStorage.getItem('cartTotal') || 0;
    document.getElementById('final-total').innerText = formatMoney(totalAmount); // formatMoney từ utils.js
    
    // Hiển thị số lượng món hàng tóm tắt
    document.getElementById('order-items-summary').innerHTML = `
        <div class="summary-item">
            <span>Số lượng sản phẩm:</span>
            <span>${cart.length} món</span>
        </div>
    `;

    // 3. Xử lý nút Đặt Hàng
    document.getElementById('order-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btnSubmit = document.getElementById('btn-place-order');
        btnSubmit.innerText = 'Đang xử lý...';
        btnSubmit.disabled = true;

        // Chuẩn bị dữ liệu gửi xuống Backend
        const orderData = {
            orderItems: cart, // Gửi mảng {productId, qty}
            shippingInfo: {
                address: document.getElementById('shippingAddress').value,
                phone: document.getElementById('shippingPhone').value
            },
            paymentMethod: document.getElementById('paymentMethod').value,
            totalPrice: Number(totalAmount) 
        };

        try {
            // Nhớ gọi hàm getAuthHeaders() từ utils.js để đính kèm Token
            const res = await fetch('http://localhost:5000/api/orders', {
                method: 'POST',
                headers: getAuthHeaders(), 
                body: JSON.stringify(orderData)
            });

            const data = await res.json();

            if (res.ok) {
                alert('✅ Đặt hàng thành công!');
                // Xóa giỏ hàng
                localStorage.removeItem('cart');
                localStorage.removeItem('cartTotal');
                // Chuyển về trang chủ (hoặc trang lịch sử đơn hàng nếu có)
                window.location.href = '../home/index.html';
            } else {
                alert('❌ Lỗi đặt hàng: ' + data.message);
                btnSubmit.innerText = 'Xác nhận Đặt hàng';
                btnSubmit.disabled = false;
            }
        } catch (error) {
            console.error(error);
            alert('Lỗi kết nối tới Server!');
            btnSubmit.innerText = 'Xác nhận Đặt hàng';
            btnSubmit.disabled = false;
        }
    });
});