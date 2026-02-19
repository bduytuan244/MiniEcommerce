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
        checkLoginState();
    });
    fetch('../layouts/footer.html').then(r => r.text()).then(h => document.getElementById('footer').innerHTML = h);

    document.getElementById('user-name').textContent = user.name;
    document.getElementById('user-email').textContent = user.email;

    loadMyOrders();
});

async function loadMyOrders() {
    const orderListEl = document.getElementById('order-list');
    
    try {
        const res = await fetch('http://localhost:5000/api/orders/myorders', {
            headers: getAuthHeaders()
        });

        const orders = await res.json();

        if (!res.ok) {
            orderListEl.innerHTML = `<tr><td colspan="5" style="color:red">Lỗi: ${orders.message}</td></tr>`;
            return;
        }

        if (orders.length === 0) {
            orderListEl.innerHTML = `<tr><td colspan="5" style="text-align:center">Bạn chưa có đơn hàng nào. <a href="../home/index.html">Mua ngay!</a></td></tr>`;
            return;
        }

        orderListEl.innerHTML = orders.map(order => {
            const date = new Date(order.createdAt).toLocaleDateString('vi-VN');
            const total = formatMoney(order.totalPrice); 
            
            let badgeClass = 'badge-pending';
            let statusText = 'Chờ xử lý';
            
            if(order.isDelivered) { badgeClass = 'badge-delivered'; statusText = 'Đã giao'; }
            else if(order.isPaid) { badgeClass = 'badge-shipping'; statusText = 'Đã thanh toán'; } 

            return `
                <tr>
                    <td>#${order._id.substring(order._id.length - 6).toUpperCase()}</td>
                    <td>${date}</td>
                    <td style="color:#d32f2f; font-weight:bold">${total}</td>
                    <td><span class="badge ${badgeClass}">${statusText}</span></td>
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

function logout() {
    if(confirm("Bạn muốn đăng xuất?")) {
        localStorage.clear();
        window.location.href = '../auth/login.html';
    }
}

function viewOrderDetail(id) {
    alert("Tính năng xem chi tiết đơn hàng #" + id + " sẽ làm ở phần sau!");
}