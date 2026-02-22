document.addEventListener('DOMContentLoaded', () => {
    const detailContainer = document.getElementById('detail-content');
    const headerContainer = document.getElementById('header');
    const footerContainer = document.getElementById('footer');

    async function loadLayout() {
        try {
            const headRes = await fetch('../layouts/header.html');
            if(headRes.ok) {
                headerContainer.innerHTML = await headRes.text();
                if(typeof checkLoginState === 'function') checkLoginState();
            }
            
            const footRes = await fetch('../layouts/footer.html');
            if(footRes.ok) footerContainer.innerHTML = await footRes.text();
        } catch (err) { console.error(err); }
    }

    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    async function loadProductDetail() {
        if (!productId) {
            detailContainer.innerHTML = '<p style="text-align:center; width:100%;">Không tìm thấy sản phẩm!</p>';
            return;
        }

        try {
            const res = await fetch(`http://localhost:5000/api/products/${productId}`);
            const product = await res.json();

            if (!res.ok) {
                detailContainer.innerHTML = `<p style="text-align:center; width:100%; color:red;">${product.message || 'Lỗi tải sản phẩm'}</p>`;
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
                    <h1 class="product-title">${product.name}</h1>
                    <div class="product-meta">
                        <span><i class="fa-solid fa-tag"></i> Thương hiệu: <strong>${product.brand || 'Khác'}</strong></span>
                        <span><i class="fa-solid fa-folder-open"></i> Danh mục: <strong>${product.category || 'Chung'}</strong></span>
                        <span><i class="fa-solid fa-box"></i> Kho: <strong>${product.stock || 0}</strong></span>
                    </div>
                    
                    <div class="price-box">
                        <p class="product-price">${Number(product.price).toLocaleString('vi-VN')} đ</p>
                    </div>
                    
                    <p style="line-height: 1.6; color: #444; margin-bottom: 20px;">
                        ${product.description || 'Chưa có mô tả chi tiết cho sản phẩm này.'}
                    </p>
                    
                    <div class="action-box">
                        <button class="btn-buy" onclick="addToCart('${product._id}')">
                            <i class="fa-solid fa-cart-shopping"></i> Thêm vào giỏ hàng
                        </button>
                    </div>
                </div>
            `;

        } catch (error) {
            console.error(error);
            detailContainer.innerHTML = '<p style="text-align:center; width:100%; color:red;">Lỗi kết nối Server!</p>';
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
    
    if(typeof updateCartBadge === 'function') updateCartBadge();

    Swal.fire({
        title: 'Thành công!',
        text: 'Đã thêm sản phẩm vào giỏ hàng',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
    });
}

async function loadReviews(productId) {
    const list = document.getElementById('review-list');
    if (!list) return;

    try {
        const res = await fetch(`http://localhost:5000/api/reviews/${productId}`);
        const reviews = await res.json();

        if (reviews.length === 0) {
            list.innerHTML = '<p style="font-style:italic; color:#777; text-align:center;">Chưa có đánh giá nào. Hãy là người đầu tiên!</p>';
            return;
        }

        list.innerHTML = reviews.map(r => {
            const starsHtml = '<i class="fa-solid fa-star star-color"></i>'.repeat(r.rating) 
                            + '<i class="fa-regular fa-star star-color"></i>'.repeat(5 - r.rating);

            return `
            <div style="margin-bottom: 15px; padding: 20px; background: #fafafa; border-radius: 8px; border-left: 4px solid #ee4d2d;">
                <div style="display:flex; justify-content:space-between; margin-bottom: 8px;">
                    <strong style="color:#333;"><i class="fa-solid fa-circle-user" style="color:#aaa; margin-right:5px;"></i>${r.name}</strong>
                    <span style="font-size: 0.85em; color: #888;">${new Date(r.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>
                <div style="margin-bottom: 10px; font-size: 0.9rem;">${starsHtml}</div>
                <p style="margin: 0; color: #555; line-height: 1.5;">${r.comment}</p>
            </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error("Lỗi load review:", error);
    }
}

async function submitReview(e, productId) {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    if (!token) {
        Swal.fire({
            title: 'Chưa đăng nhập',
            text: 'Bạn cần đăng nhập để viết đánh giá',
            icon: 'info',
            confirmButtonText: 'Tới trang Đăng nhập',
            showCancelButton: true,
            cancelButtonText: 'Hủy'
        }).then((result) => {
            if (result.isConfirmed) {
                window.location.href = '../auth/login.html';
            }
        });
        return;
    }

    const rating = document.getElementById('rating').value;
    const comment = document.getElementById('comment').value;
    const btnSubmit = e.target.querySelector('button');

    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang gửi...';

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
            Swal.fire('Thành công!', 'Cảm ơn bạn đã đánh giá', 'success');
            document.getElementById('comment').value = ''; 
            loadReviews(productId); 
        } else {
            Swal.fire('Lỗi!', data.message || "Không thể gửi đánh giá", 'error');
        }
    } catch (error) {
        Swal.fire('Lỗi!', 'Không thể kết nối đến máy chủ', 'error');
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Gửi đánh giá';
    }
}