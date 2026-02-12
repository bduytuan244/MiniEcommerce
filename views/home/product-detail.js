document.addEventListener('DOMContentLoaded', () => {
    const detailContainer = document.getElementById('detail-content');
    const headerContainer = document.getElementById('header');
    const footerContainer = document.getElementById('footer');

    async function loadLayout() {
        try {
            const headRes = await fetch('../layouts/header.html');
            if(headRes.ok) headerContainer.innerHTML = await headRes.text();
            
            const footRes = await fetch('../layouts/footer.html');
            if(footRes.ok) footerContainer.innerHTML = await footRes.text();
            
            checkLoginState();
        } catch (err) { console.error(err); }
    }

    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    async function loadProductDetail() {
        if (!productId) {
            detailContainer.innerHTML = '<p>Không tìm thấy sản phẩm!</p>';
            return;
        }

        try {
            const res = await fetch(`http://localhost:5000/api/products/${productId}`);
            const product = await res.json();

            if (!res.ok) {
                detailContainer.innerHTML = `<p>${product.message || 'Lỗi tải sản phẩm'}</p>`;
                return;
            }

            const imageUrl = product.images && product.images.length > 0 
                ? product.images[0] 
                : 'https://via.placeholder.com/500x500?text=No+Image';

            detailContainer.innerHTML = `
                <div class="left-column">
                    <img src="${imageUrl}" alt="${product.name}">
                </div>
                <div class="right-column">
                    <h1>${product.name}</h1>
                    <p>Thương hiệu: <strong>${product.brand}</strong> | Danh mục: <strong>${product.category}</strong></p>
                    
                    <div class="product-price">${product.price.toLocaleString('vi-VN')} đ</div>
                    
                    <p class="stock-status">Tồn kho: ${product.stock} sản phẩm</p>
                    
                    <p>${product.description}</p>
                    
                    <button class="btn-buy" onclick="addToCart('${product._id}')">
                        🛒 Thêm vào giỏ hàng
                    </button>
                    
                    <a href="index.html" style="margin-top:10px; text-decoration:none; color:#007bff">
                        ← Quay lại trang chủ
                    </a>
                </div>
            `;

        } catch (error) {
            console.error(error);
            detailContainer.innerHTML = '<p>Lỗi kết nối Server!</p>';
        }
    }

    loadLayout();
    loadProductDetail();
});

function addToCart(productId) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existingItem = cart.find(item => item.productId === productId);
    
    if (existingItem) {
        existingItem.qty += 1;
    } else {
        cart.push({ productId: productId, qty: 1 });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    alert('✅ Đã thêm vào giỏ hàng!');
}

function checkLoginState() {
    const user = localStorage.getItem('user');
    const loginLink = document.querySelector('nav a[href="login.html"]');
    if (user && loginLink) {
        const userData = JSON.parse(user);
        loginLink.textContent = `Hi, ${userData.name}`;
        loginLink.href = "#";
    }
}