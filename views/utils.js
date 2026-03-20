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
    const sellerLink = document.getElementById('link-seller-center'); 

    if (token && userStr) {
        const user = JSON.parse(userStr);
        
        if (loginLink) loginLink.style.display = 'none';
        if (userMenu) userMenu.style.display = 'flex';
        if (userNameDisplay) userNameDisplay.innerText = user.name;

        if (user.isSeller === true) {
            if (sellerLink) {
                sellerLink.style.display = 'flex';
            }
        } else {
            if (sellerLink) {
                sellerLink.style.display = 'none';
            }
        }
    } else {
        if (loginLink) loginLink.style.display = 'flex';
        if (userMenu) userMenu.style.display = 'none';
        if (sellerLink) sellerLink.style.display = 'none';
    }
}

function logoutUser() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '../home/index.html'; 
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