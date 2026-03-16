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

    const loginLink = document.getElementById('login-link');
    const userMenu = document.getElementById('user-menu');
    const userNameDisplay = document.getElementById('user-name-display');

    if (token && userStr && loginLink && userMenu) {
        const user = JSON.parse(userStr);
        
        loginLink.style.display = 'none'; 
        userMenu.style.display = 'flex';  
        
        if (userNameDisplay) {
            userNameDisplay.innerText = user.name; 
        }
    }

    updateCartBadge();
}

function updateCartBadge() {
    const cartBadge = document.getElementById('cart-badge');
    if (cartBadge) {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        cartBadge.innerText = cart.length; 
    }
}

function logoutUser() {
    if(confirm("Bạn chắc chắn muốn đăng xuất?")) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('cart');
        
        window.location.href = '../auth/login.html';
    }
}