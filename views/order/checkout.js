document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Bạn cần đăng nhập để tiến hành thanh toán!');
        window.location.href = '../auth/login.html';
        return; 
    }

    // Load Header & Footer
    fetch('../layouts/header.html').then(res => res.text()).then(html => {
        document.getElementById('header').innerHTML = html;
        checkLoginState(); 
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

    const userStr = localStorage.getItem('user');
    if(userStr) {
        const userData = JSON.parse(userStr);
        document.getElementById('shippingName').value = userData.name || '';
    }

    const totalAmount = localStorage.getItem('cartTotal') || 0;
    document.getElementById('final-total').innerText = formatMoney(totalAmount); 
    
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

        const orderData = {
            orderItems: cart,
            shippingInfo: {
                address: document.getElementById('shippingAddress').value,
                phone: document.getElementById('shippingPhone').value
            },
            paymentMethod: document.getElementById('paymentMethod').value,
            totalPrice: Number(totalAmount) 
        };

        try {
            const res = await fetch('http://localhost:5000/api/orders', {
                method: 'POST',
                headers: getAuthHeaders(), 
                body: JSON.stringify(orderData)
            });

            const data = await res.json();

            if (res.ok) {
                alert('Đặt hàng thành công!');
                localStorage.removeItem('cart');
                localStorage.removeItem('cartTotal');
                window.location.href = '../home/index.html';
            } else {
                alert('Lỗi đặt hàng: ' + data.message);
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
    originalTotal = Number(localStorage.getItem('cartTotal') || 0);
    document.getElementById('final-total').innerText = formatMoney(originalTotal);
});

async function applyCoupon() {
    const code = document.getElementById('coupon-code').value.trim();
    const msgEl = document.getElementById('coupon-message');
    
    if (!code) {
        msgEl.style.color = 'red';
        msgEl.innerText = "Vui lòng nhập mã!";
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/coupons/check', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ code })
        });

        const data = await res.json();

        if (res.ok) {
            currentDiscount = data.discount; 
            
            const discountAmount = originalTotal * (currentDiscount / 100);
            const newTotal = originalTotal - discountAmount;
            
            msgEl.style.color = 'green';
            msgEl.innerText = `${data.message}`;
            
            document.getElementById('final-total').innerHTML = `
                <span style="text-decoration: line-through; color: #999; font-size: 0.8em;">${formatMoney(originalTotal)}</span>
                <br>
                <span>${formatMoney(newTotal)}</span>
            `;
            
            document.getElementById('coupon-code').disabled = true;
            
        } else {
            currentDiscount = 0; 
            msgEl.style.color = 'red';
            msgEl.innerText = `${data.message}`;
            document.getElementById('final-total').innerText = formatMoney(originalTotal);
        }
    } catch (error) {
        console.error(error);
        msgEl.innerText = "Lỗi kết nối Server";
    }
}