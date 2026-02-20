// Biến lưu trữ tiền bạc
let originalTotal = 0;   // Tổng tiền gốc ban đầu
let finalTotalToPay = 0; // Tổng tiền sau khi áp mã giảm (Sẽ gửi lên Server)
let currentDiscount = 0; // % giảm giá

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Bạn cần đăng nhập để tiến hành thanh toán!');
        window.location.href = '../auth/login.html';
        return; 
    }

    // 1. Load Header & Footer
    fetch('../layouts/header.html').then(res => res.text()).then(html => {
        document.getElementById('header').innerHTML = html;
        if(typeof checkLoginState === 'function') checkLoginState(); 
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

    // 3. Điền thông tin User
    const userStr = localStorage.getItem('user');
    if(userStr) {
        const userData = JSON.parse(userStr);
        document.getElementById('shippingName').value = userData.name || '';
    }

    // 4. Tính toán tiền ban đầu
    originalTotal = Number(localStorage.getItem('cartTotal') || 0);
    finalTotalToPay = originalTotal; // Chưa nhập mã thì Tiền gốc = Tiền phải trả
    
    // Hiển thị tổng cộng (dùng hàm formatMoney từ utils.js)
    document.getElementById('final-total').innerText = formatMoney(finalTotalToPay); 
    
    // Hiển thị Tóm tắt số lượng món hàng
    document.getElementById('order-items-summary').innerHTML = `
        <div class="summary-item">
            <span>Số lượng sản phẩm:</span>
            <span>${cart.length} món</span>
        </div>
        <div class="summary-item" style="border:none; padding-bottom: 0;">
            <span>Tạm tính:</span>
            <span>${formatMoney(originalTotal)}</span>
        </div>
    `;

    // 5. Xử lý nút Đặt Hàng
    document.getElementById('order-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btnSubmit = document.getElementById('btn-place-order');
        btnSubmit.innerText = 'Đang xử lý...';
        btnSubmit.disabled = true;

        const orderData = {
            orderItems: cart,
            shippingInfo: {
                address: document.getElementById('shippingAddress').value,
                phone: document.getElementById('shippingPhone').value
            },
            paymentMethod: document.getElementById('paymentMethod').value,
            // 👇 Gửi số tiền cuối cùng (đã trừ mã giảm giá nếu có) lên Server
            totalPrice: finalTotalToPay 
        };

        try {
            const res = await fetch('http://localhost:5000/api/orders', {
                method: 'POST',
                headers: typeof getAuthHeaders === 'function' ? getAuthHeaders() : {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }, 
                body: JSON.stringify(orderData)
            });

            const data = await res.json();

            if (res.ok) {
                alert('🎉 Đặt hàng thành công!');
                localStorage.removeItem('cart');
                localStorage.removeItem('cartTotal');
                window.location.href = '../profile/profile.html'; // Chuyển về trang Lịch sử đơn hàng
            } else {
                alert('❌ Lỗi đặt hàng: ' + data.message);
                btnSubmit.innerText = 'Xác nhận Đặt hàng';
                btnSubmit.disabled = false;
            }
        } catch (error) {
            console.error(error);
            alert('❌ Lỗi kết nối tới Server!');
            btnSubmit.innerText = 'Xác nhận Đặt hàng';
            btnSubmit.disabled = false;
        }
    });
});

// 6. Hàm xử lý Mã giảm giá (Nằm ngoài DOMContentLoaded để HTML gọi được)
async function applyCoupon() {
    // Đã sửa lại đúng ID 'coupon-code' và 'coupon-message' của HTML
    const codeInput = document.getElementById('coupon-code').value.trim(); 
    const messageEl = document.getElementById('coupon-message'); 

    if (!codeInput) {
        messageEl.innerHTML = '<span style="color:red;">❌ Vui lòng nhập mã!</span>';
        return;
    }

    messageEl.innerHTML = '<span style="color:blue;">⏳ Đang kiểm tra...</span>';

    try {
        const token = localStorage.getItem('token');
        
        const res = await fetch('http://localhost:5000/api/coupons/apply', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ code: codeInput })
        });

        const data = await res.json();

        if (res.ok) {
            // Áp dụng thành công -> Lưu % giảm giá
            currentDiscount = data.discount;
            
            // Tính số tiền được giảm và tiền phải trả
            const discountAmount = originalTotal * (currentDiscount / 100);
            finalTotalToPay = originalTotal - discountAmount;

            // In thông báo màu xanh và đổi số tổng tiền ở dưới cùng
            messageEl.innerHTML = `<span style="color:green; font-weight:bold;">✅ ${data.message} (Giảm ${currentDiscount}%)</span>`;
            document.getElementById('final-total').innerText = formatMoney(finalTotalToPay);

        } else {
            // Mã sai hoặc hết hạn -> Reset lại như cũ
            messageEl.innerHTML = `<span style="color:red;">❌ ${data.message}</span>`;
            currentDiscount = 0;
            finalTotalToPay = originalTotal;
            document.getElementById('final-total').innerText = formatMoney(finalTotalToPay);
        }

    } catch (error) {
        console.error(error);
        messageEl.innerHTML = '<span style="color:red;">❌ Lỗi kết nối Server</span>';
    }
}