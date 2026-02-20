document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
        alert("Vui lòng đăng nhập để xem hồ sơ!");
        window.location.href = '../auth/login.html';
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
            orderListEl.innerHTML = `<tr><td colspan="5" style="text-align:center">Bạn chưa có đơn hàng nào. <a href="../home/index.html">Mua ngay!</a></td></tr>`;
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
                    <td>#${order._id.substring(order._id.length - 6).toUpperCase()}</td>
                    <td>${date}</td>
                    <td style="color:#d32f2f; font-weight:bold">${total}</td>
                    <td><span class="badge ${badgeClass}">${status}</span></td>
                    <td>
                        <button onclick="viewOrderDetail('${order._id}')" style="cursor:pointer; color:blue; border:none; background:none; text-decoration:underline;">Xem</button>
                    </td>
                </tr>
            `;
        }).join('');

    } catch (error) {
        console.error(error);
        orderListEl.innerHTML = `<tr><td colspan="5" style="color:red; text-align:center">Lỗi kết nối Server</td></tr>`;
    }
}

function viewOrderDetail(id) {
    window.location.href = `order-detail.html?id=${id}`;
}

function logout() {
    if(confirm("Bạn muốn đăng xuất?")) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        localStorage.removeItem('adminToken'); 
        
        window.location.href = '../auth/login.html';
    }
}