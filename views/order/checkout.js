let originalTotal = 0;   
let finalTotalToPay = 0; 
let currentDiscount = 0; 

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        Swal.fire({
            title: 'Yêu cầu đăng nhập',
            text: 'Bạn cần đăng nhập để tiến hành thanh toán!',
            icon: 'warning',
            confirmButtonText: 'Đăng nhập ngay'
        }).then(() => {
            window.location.href = '../auth/login.html';
        });
        return; 
    }

    fetch('../layouts/header.html').then(res => res.text()).then(html => {
        document.getElementById('header').innerHTML = html;
        if(typeof checkLoginState === 'function') checkLoginState(); 
    });
    fetch('../layouts/footer.html').then(res => res.text()).then(html => {
        document.getElementById('footer').innerHTML = html;
    });

    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart.length === 0) {
        Swal.fire('Giỏ hàng trống!', 'Vui lòng chọn sản phẩm trước khi thanh toán.', 'info')
            .then(() => window.location.href = '../home/index.html');
        return;
    }

    const userStr = localStorage.getItem('user');
    if(userStr) {
        const userData = JSON.parse(userStr);
        document.getElementById('shippingName').value = userData.name || '';
    }

    originalTotal = Number(localStorage.getItem('cartTotal') || 0);
    finalTotalToPay = originalTotal; 
    document.getElementById('final-total').innerText = formatMoney(finalTotalToPay); 
    
    let itemsHtml = '<div style="max-height: 250px; overflow-y: auto; margin-bottom: 15px; padding-right: 5px;">';
    for (const item of cart) {
        try {
            const res = await fetch(`http://localhost:5000/api/products/${item.productId}`);
            if (res.ok) {
                const product = await res.json();
                const img = product.images && product.images[0] ? product.images[0] : 'https://via.placeholder.com/50';
                const price = Number(product.price).toLocaleString('vi-VN');
                const itemTotal = (product.price * item.qty).toLocaleString('vi-VN');
                
                itemsHtml += `
                    <div style="display: flex; gap: 15px; margin-bottom: 12px; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 12px;">
                        <img src="${img}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px; border: 1px solid #ddd;">
                        <div style="flex: 1;">
                            <div style="font-weight: 600; font-size: 0.9rem; color: #333; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden;">${product.name}</div>
                            <div style="color: #888; font-size: 0.8rem; margin-top: 4px;">Đơn giá: ${price} đ <span style="color:#ee4d2d; font-weight:bold; margin-left: 10px;">x ${item.qty}</span></div>
                        </div>
                        <div style="font-weight: bold; color: #333; font-size: 0.95rem;">
                            ${itemTotal} đ
                        </div>
                    </div>
                `;
            }
        } catch (error) { console.error("Lỗi tải sp:", error); }
    }
    itemsHtml += '</div>';

    document.getElementById('order-items-summary').innerHTML = itemsHtml + `
        <div class="summary-item" style="margin-top: 15px;">
            <span>Tổng số lượng:</span>
            <span style="font-weight: 600; color: #333;">${cart.length} sản phẩm</span>
        </div>
        <div class="summary-item">
            <span>Tạm tính:</span>
            <span style="font-weight: 600; color: #333;">${formatMoney(originalTotal)}</span>
        </div>
        <div class="summary-item" id="discount-row" style="display: none; color: #28a745;">
            <span>Giảm giá:</span>
            <span id="discount-amount" style="font-weight: bold;">- 0 đ</span>
        </div>
    `;

    document.getElementById('order-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btnSubmit = document.getElementById('btn-place-order');
        btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang xử lý...';
        btnSubmit.disabled = true;

        const paymentMethod = document.getElementById('paymentMethod').value;
        const orderData = {
            orderItems: cart,
            shippingInfo: {
                address: document.getElementById('shippingAddress').value,
                phone: document.getElementById('shippingPhone').value
            },
            paymentMethod: paymentMethod,
            totalPrice: finalTotalToPay 
        };

        try {
            const res = await fetch('http://localhost:5000/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }, 
                body: JSON.stringify(orderData)
            });

            const data = await res.json();

            if (res.ok) {
                localStorage.removeItem('cart');
                localStorage.removeItem('cartTotal');
                
                if (paymentMethod === 'VNPAY') {
                    btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang chuyển sang VNPAY...';
                    const vnPayRes = await fetch(`http://localhost:5000/api/payment/create_payment_url/${data._id}`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    
                    const vnPayData = await vnPayRes.json();
                    
                    if (vnPayRes.ok && vnPayData.url) {
                        window.location.href = vnPayData.url; 
                    } else {
                        Swal.fire('Lỗi', 'Không thể tạo link VNPAY. Vui lòng thanh toán sau trong trang Chi tiết đơn hàng!', 'error')
                        .then(() => window.location.href = '../profile/profile.html');
                    }
                } else {
                    Swal.fire({
                        title: '🎉 Đặt hàng thành công!',
                        text: 'Cảm ơn bạn đã tin tưởng mua sắm tại Mini Shop. Chúng tôi đã gửi email xác nhận cho bạn.',
                        icon: 'success',
                        confirmButtonColor: '#ee4d2d',
                        confirmButtonText: 'Xem lịch sử đơn hàng',
                        allowOutsideClick: false
                    }).then(() => {
                        window.location.href = '../profile/profile.html'; 
                    });
                }
            } else {
                Swal.fire('Lỗi đặt hàng', data.message, 'error');
                btnSubmit.innerHTML = '<i class="fa-solid fa-check"></i> Hoàn tất đặt hàng';
                btnSubmit.disabled = false;
            }
        } catch (error) {
            Swal.fire('Lỗi', 'Lỗi kết nối tới Server!', 'error');
            btnSubmit.innerHTML = '<i class="fa-solid fa-check"></i> Hoàn tất đặt hàng';
            btnSubmit.disabled = false;
        }
    });
});

async function applyCoupon() {
    const codeInput = document.getElementById('coupon-code').value.trim(); 
    const messageEl = document.getElementById('coupon-message'); 
    const discountRow = document.getElementById('discount-row');
    const discountAmountEl = document.getElementById('discount-amount');

    if (!codeInput) {
        messageEl.innerHTML = '<span style="color:#dc3545;"><i class="fa-solid fa-circle-exclamation"></i> Vui lòng nhập mã giảm giá!</span>';
        return;
    }

    messageEl.innerHTML = '<span style="color:#007bff;"><i class="fa-solid fa-spinner fa-spin"></i> Đang kiểm tra...</span>';

    try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/coupons/apply', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ code: codeInput })
        });
        const data = await res.json();

        if (res.ok) {
            currentDiscount = data.discount;
            const discountAmount = originalTotal * (currentDiscount / 100);
            finalTotalToPay = originalTotal - discountAmount;
            discountRow.style.display = 'flex';
            discountAmountEl.innerText = '- ' + formatMoney(discountAmount);
            messageEl.innerHTML = `<span style="color:#28a745; font-weight:600;"><i class="fa-solid fa-circle-check"></i> Áp dụng thành công (Giảm ${currentDiscount}%)</span>`;
            document.getElementById('final-total').innerText = formatMoney(finalTotalToPay);
        } else {
            discountRow.style.display = 'none';
            messageEl.innerHTML = `<span style="color:#dc3545;"><i class="fa-solid fa-circle-xmark"></i> ${data.message}</span>`;
            currentDiscount = 0;
            finalTotalToPay = originalTotal;
            document.getElementById('final-total').innerText = formatMoney(finalTotalToPay);
        }
    } catch (error) {
        messageEl.innerHTML = '<span style="color:#dc3545;"><i class="fa-solid fa-circle-xmark"></i> Lỗi kết nối Server</span>';
    }
}