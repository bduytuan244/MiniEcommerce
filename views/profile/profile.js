document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
        Swal.fire({
            title: 'Chưa đăng nhập',
            text: 'Vui lòng đăng nhập để xem thông tin tài khoản!',
            icon: 'warning',
            confirmButtonText: 'Đăng nhập ngay',
            allowOutsideClick: false
        }).then(() => {
            window.location.href = '../auth/login.html';
        });
        return;
    }

    const user = JSON.parse(userStr);

    fetch('../layouts/header.html').then(r => r.text()).then(h => {
        document.getElementById('header').innerHTML = h;
        if(typeof checkLoginState === 'function') checkLoginState();
    });
    fetch('../layouts/footer.html').then(r => r.text()).then(h => {
        document.getElementById('footer').innerHTML = h;
    });

    document.getElementById('user-name').textContent = user.name;
    document.getElementById('user-email').textContent = user.email;

    loadMyOrders();
});

async function loadMyOrders() {
    const orderListEl = document.getElementById('order-list');
    const token = localStorage.getItem('token'); 
    
    try {
        const res = await fetch('http://localhost:5000/api/orders/myorders', {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const orders = await res.json();

        if (!res.ok) {
            orderListEl.innerHTML = `<tr><td colspan="5" style="color:red; text-align:center">Lỗi: ${orders.message}</td></tr>`;
            return;
        }

        if (orders.length === 0) {
            orderListEl.innerHTML = `
                <tr><td colspan="5" style="text-align:center; padding: 40px 0; color: #777;">
                    <i class="fa-solid fa-receipt" style="font-size: 3rem; color: #ddd; margin-bottom: 15px; display: block;"></i>
                    Bạn chưa có đơn hàng nào. <br><br>
                    <a href="../home/index.html" style="background: #ee4d2d; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Mua sắm ngay</a>
                </td></tr>
            `;
            return;
        }

        orderListEl.innerHTML = orders.map(order => {
            const date = new Date(order.createdAt).toLocaleDateString('vi-VN');
            const total = Number(order.totalPrice).toLocaleString('vi-VN') + ' đ'; 
            
            let badgeClass = 'badge-pending';
            const status = order.status || 'Chờ xác nhận';
            
            if (status === 'Đang đóng gói' || status === 'Đang vận chuyển') {
                badgeClass = 'badge-shipping'; 
            } else if (status === 'Hoàn thành') {
                badgeClass = 'badge-delivered'; 
            } else if (status === 'Đã hủy' || status === 'Trả hàng') {
                badgeClass = 'badge-cancelled';
            }

            return `
                <tr>
                    <td class="order-id">#${order._id.substring(order._id.length - 6).toUpperCase()}</td>
                    <td>${date}</td>
                    <td class="order-total">${total}</td>
                    <td style="text-align: center;"><span class="badge ${badgeClass}">${status}</span></td>
                    <td style="text-align: center;">
                        <a href="order-detail.html?id=${order._id}" class="btn-view">Chi tiết</a>
                    </td>
                </tr>
            `;
        }).join('');

    } catch (error) {
        console.error(error);
        orderListEl.innerHTML = `<tr><td colspan="5" style="color:red; text-align:center">Lỗi kết nối Server</td></tr>`;
    }
}

function confirmLogout() {
    Swal.fire({
        title: 'Đăng xuất?',
        text: "Bạn có chắc chắn muốn thoát tài khoản không?",
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Đăng xuất',
        cancelButtonText: 'Hủy'
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('adminToken'); 
            window.location.href = '../auth/login.html';
        }
    });
}
document.addEventListener('DOMContentLoaded', () => {
    const btnBecomeSeller = document.getElementById('btn-become-seller');
    const userStr = localStorage.getItem('user');
    
    if (btnBecomeSeller && userStr) {
        const user = JSON.parse(userStr);

        if (user.isSeller || user.sellerStatus === 'approved') {
            btnBecomeSeller.style.display = 'none'; 
        } else if (user.sellerStatus === 'pending') {
            btnBecomeSeller.innerText = 'Đang chờ Admin duyệt...';
            btnBecomeSeller.disabled = true;
            btnBecomeSeller.style.backgroundColor = '#6c757d'; 
            btnBecomeSeller.style.cursor = 'not-allowed';
        }

        btnBecomeSeller.addEventListener('click', async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                Swal.fire('Lỗi', 'Vui lòng đăng nhập trước!', 'error');
                return;
            }

            const result = await Swal.fire({
                title: 'Đăng ký Bán hàng?',
                text: "Yêu cầu của bạn sẽ được gửi đến Admin để xét duyệt.",
                icon: 'info',
                showCancelButton: true,
                confirmButtonColor: '#ee4d2d',
                cancelButtonColor: '#6c757d',
                confirmButtonText: 'Gửi yêu cầu'
            });

            if (result.isConfirmed) {
                const originalText = btnBecomeSeller.innerText;
                btnBecomeSeller.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang gửi...';
                btnBecomeSeller.disabled = true;

                try {
                    const res = await fetch('http://localhost:5000/api/users/request-seller', {
                        method: 'POST', 
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}` 
                        }
                    });

                    const data = await res.json();

                    if (res.ok) {
                        localStorage.setItem('user', JSON.stringify(data.user));
                        
                        Swal.fire('Thành công!', data.message, 'success');
                        
                        btnBecomeSeller.innerText = 'Đang chờ Admin duyệt...';
                        btnBecomeSeller.style.backgroundColor = '#6c757d';
                        btnBecomeSeller.style.cursor = 'not-allowed';
                        btnBecomeSeller.disabled = true;
                    } else {
                        Swal.fire('Lỗi', data.message, 'error');
                        btnBecomeSeller.innerText = originalText;
                        btnBecomeSeller.disabled = false;
                    }
                } catch (error) {
                    Swal.fire('Lỗi', 'Không kết nối được với máy chủ', 'error');
                    btnBecomeSeller.innerText = originalText;
                    btnBecomeSeller.disabled = false;
                }
            }
        });
    }
});