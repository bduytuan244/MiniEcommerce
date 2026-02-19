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
            detailContainer.innerHTML = '<p style="text-align:center">Không tìm thấy sản phẩm!</p>';
            return;
        }

        try {
            const res = await fetch(`http://localhost:5000/api/products/${productId}`);
            const product = await res.json();

            if (!res.ok) {
                detailContainer.innerHTML = `<p style="text-align:center">${product.message || 'Lỗi tải sản phẩm'}</p>`;
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
                    <p style="color:#666;">Thương hiệu: <strong>${product.brand || 'Khác'}</strong> | Danh mục: <strong>${product.category || 'Chung'}</strong></p>
                    
                    <div class="product-price">${Number(product.price).toLocaleString('vi-VN')} đ</div>
                    

                    <p class="stock-status">Tồn kho: ${product.stock} sản phẩm</p>
                    
                    <p style="margin: 20px 0; line-height: 1.6;">${product.description || 'Chưa có mô tả'}</p>
                    
                    <button class="btn-buy" onclick="addToCart('${product._id}')">
                        Thêm vào giỏ hàng
                    </button>
                    
                    <a href="index.html" style="display:block; margin-top:20px; text-decoration:none; color:#007bff">
                        ← Quay lại trang chủ
                    </a>
                </div>
            `;

        } catch (error) {
            console.error(error);
            detailContainer.innerHTML = '<p style="text-align:center">Lỗi kết nối Server!</p>';
        }
    }

    loadLayout();
    loadProductDetail();

    if (productId) {
        loadReviews(productId);
        
        const reviewForm = document.getElementById('form-review');
        if(reviewForm) {
            reviewForm.addEventListener('submit', (e) => submitReview(e, productId));
        }
    }
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
    alert('Đã thêm vào giỏ hàng!');
}

function checkLoginState() {
    const user = localStorage.getItem('user');
    const loginLink = document.querySelector('nav a[href*="login"]'); 
    
    if (user && loginLink) {
        const userData = JSON.parse(user);
        loginLink.innerHTML = `👤 ${userData.name}`;
        loginLink.href = "../profile/profile.html"; 
        loginLink.style.color = "#ffc107";
    }
}

async function loadReviews(productId) {
    const list = document.getElementById('review-list');
    if (!list) return;

    try {
        const res = await fetch(`http://localhost:5000/api/reviews/${productId}`);
        const reviews = await res.json();

        if (reviews.length === 0) {
            list.innerHTML = '<p style="font-style:italic; color:#777;">Chưa có đánh giá nào. Hãy là người đầu tiên!</p>';
            return;
        }

        list.innerHTML = reviews.map(r => `
            <div style="margin-bottom: 15px; padding: 15px; background: #f9f9f9; border-radius: 8px; border-left: 4px solid #ffc107;">
                <div style="display:flex; justify-content:space-between;">
                    <strong>${r.name}</strong>
                    <span style="font-size: 0.85em; color: #888;">${new Date(r.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>
                <div style="color: #ffc107; margin: 5px 0;">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</div>
                <p style="margin: 0;">${r.comment}</p>
            </div>
        `).join('');
        
    } catch (error) {
        console.error("Lỗi load review:", error);
    }
}

async function submitReview(e, productId) {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    if (!token) {
        if(confirm("Bạn cần đăng nhập để viết đánh giá. Đi tới trang đăng nhập?")) {
            window.location.href = '../auth/login.html';
        }
        return;
    }

    const rating = document.getElementById('rating').value;
    const comment = document.getElementById('comment').value;
    const btnSubmit = e.target.querySelector('button');

    btnSubmit.disabled = true;
    btnSubmit.innerText = "Đang gửi...";

    try {
        const res = await fetch(`http://localhost:5000/api/reviews`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ rating, comment, productId }) 
        });

        const data = await res.json();

        if (res.ok) {
            alert("Đánh giá thành công!");
            document.getElementById('comment').value = ''; 
            loadReviews(productId); 
        } else {
            alert("Lỗi: " + (data.message || "Không thể gửi đánh giá"));
        }
    } catch (error) {
        alert("Lỗi kết nối Server");
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerText = "Gửi đánh giá";
    }
}