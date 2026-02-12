function formatMoney(amount) {
    return Number(amount).toLocaleString('vi-VN') + ' đ';
}

function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

function checkLoginState() {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    const loginLink = document.querySelector('a[href*="login.html"]');

    if (token && userStr && loginLink) {
        const user = JSON.parse(userStr);
        
        loginLink.innerHTML = `👤 ${user.name}`;
        
        loginLink.href = "../profile/profile.html"; 
        
        // Chỉnh css một chút cho đẹp
        loginLink.style.fontWeight = "bold";
        loginLink.style.color = "#ffc107"; 
    }
}

function logout() {
    if(confirm("Bạn chắc chắn muốn đăng xuất?")) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('cart'); 
        
        window.location.href = '../auth/login.html';
    }
}