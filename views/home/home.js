let currentPage = 1;
let currentKeyword = '';
let currentSort = '-createdAt';
let currentMinPrice = '';
let currentMaxPrice = '';
let currentBrand = '';

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');

    if (paymentStatus === 'success') {
        Swal.fire('Thành công!', 'Thanh toán qua VNPAY thành công. Đơn hàng của bạn đang được xử lý.', 'success')
        .then(() => window.history.replaceState({}, document.title, window.location.pathname));
    } else if (paymentStatus === 'failed') {
        Swal.fire('Lỗi', 'Giao dịch bị hủy hoặc thanh toán thất bại!', 'error')
        .then(() => window.history.replaceState({}, document.title, window.location.pathname));
    } else if (paymentStatus === 'invalid') {
        Swal.fire('Cảnh báo', 'Dữ liệu giao dịch không hợp lệ!', 'warning')
        .then(() => window.history.replaceState({}, document.title, window.location.pathname));
    }

    const headerContainer = document.getElementById('header');
    const footerContainer = document.getElementById('footer');

    fetch('../layouts/header.html').then(res => res.text()).then(html => {
        headerContainer.innerHTML = html;
        if (typeof checkLoginState === 'function') checkLoginState();
        
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            if (user.isSeller === true) {
                const sellerLink = document.getElementById('link-seller-center');
                if (sellerLink) sellerLink.style.display = 'flex'; 
            }
        }

        const searchInput = document.getElementById('search-keyword');
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                applyFilters();
            });
        }
    });

    fetch('../layouts/footer.html').then(res => res.text()).then(html => {
        footerContainer.innerHTML = html;
    });

    loadBrands();
    loadProducts(); 
});

async function loadBrands() {
    try {
        const res = await fetch('http://localhost:5000/api/products?limit=1000');
        const data = await res.json();
        
        if (data.products && data.products.length > 0) {
            const uniqueBrands = [...new Set(data.products.map(p => p.brand).filter(b => b))];
            
            const brandSelect = document.getElementById('filter-brand');
            if (brandSelect) {
                brandSelect.innerHTML = '<option value="">Thương hiệu (Tất cả)</option>' + 
                    uniqueBrands.map(brand => `<option value="${brand}">${brand}</option>`).join('');
            }
        }
    } catch (error) {
        console.error('Lỗi tải danh sách thương hiệu:', error);
    }
}

async function loadProducts() {
    const productList = document.getElementById('product-list');
    const paginationEl = document.getElementById('pagination');

    productList.innerHTML = '<p style="width:100%; text-align:center; color:#666;"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải dữ liệu...</p>';

    try {
        let url = `http://localhost:5000/api/products?page=${currentPage}&limit=8&sort=${currentSort}`;

        if (currentKeyword) url += `&keyword=${encodeURIComponent(currentKeyword)}`;
        if (currentBrand) url += `&brand=${encodeURIComponent(currentBrand)}`;
        
        if (currentMinPrice) url += `&minPrice=${currentMinPrice}`;
        if (currentMaxPrice) url += `&maxPrice=${currentMaxPrice}`;

        const res = await fetch(url);
        const data = await res.json();

        if (data.products && data.products.length > 0) {
            renderProducts(data.products);
            renderPagination(data.totalPages, data.currentPage);
        } else {
            productList.innerHTML = '<p style="width:100%; text-align:center; color:#888;">Không tìm thấy sản phẩm nào phù hợp.</p>';
            paginationEl.innerHTML = ''; 
        }

    } catch (error) {
        console.error('Lỗi tải sản phẩm:', error);
        productList.innerHTML = '<p style="width:100%; color:red; text-align:center"><i class="fa-solid fa-triangle-exclamation"></i> Lỗi kết nối Server!</p>';
    }
}

function renderProducts(products) {
    const productList = document.getElementById('product-list');
    
    productList.innerHTML = products.map(product => {
        const imageUrl = product.images && product.images.length > 0 
            ? product.images[0] 
            : 'https://via.placeholder.com/300x200?text=No+Image';

        const price = Number(product.price).toLocaleString('vi-VN');

        return `
            <div class="product-card" onclick="window.location.href='product-detail.html?id=${product._id}'">
                <img src="${imageUrl}" alt="${product.name}">
                <h3>${product.name}</h3>
                <p class="price">${price} đ</p>
                <button class="btn-filter" style="width: 100%; margin-top: 10px; background: #ee4d2d;" onclick="event.stopPropagation(); addToCart('${product._id}')">
                    <i class="fa-solid fa-cart-plus"></i> Thêm vào giỏ
                </button>
            </div>
        `;
    }).join('');
}

function renderPagination(totalPages, page) {
    const paginationEl = document.getElementById('pagination');
    let html = '';

    if (page > 1) {
        html += `<button onclick="changePage(${page - 1})"><i class="fa-solid fa-chevron-left"></i> Trước</button>`;
    }

    for (let i = 1; i <= totalPages; i++) {
        const activeClass = i === page ? 'active' : '';
        html += `<button class="${activeClass}" onclick="changePage(${i})">${i}</button>`;
    }

    if (page < totalPages) {
        html += `<button onclick="changePage(${page + 1})">Sau <i class="fa-solid fa-chevron-right"></i></button>`;
    }

    paginationEl.innerHTML = html;
}

function applyFilters() {
    const searchEl = document.getElementById('search-keyword');
    const sortEl = document.getElementById('sort-by');
    const brandEl = document.getElementById('filter-brand');
    const priceEl = document.getElementById('filter-price');

    currentKeyword = searchEl ? searchEl.value.trim() : '';
    currentSort = sortEl ? sortEl.value : '-createdAt';
    currentBrand = brandEl ? brandEl.value : '';
    
    const priceRange = priceEl ? priceEl.value : '';

    if (priceRange) {
        const prices = priceRange.split('-');
        currentMinPrice = prices[0] ? prices[0].trim() : '';
        currentMaxPrice = prices[1] ? prices[1].trim() : '';
    } else {
        currentMinPrice = '';
        currentMaxPrice = '';
    }

    currentPage = 1;
    loadProducts();
}

function changePage(page) {
    currentPage = page;
    loadProducts();
    document.querySelector('.section-title').scrollIntoView({ behavior: 'smooth' });
}

function addToCart(productId) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existingItem = cart.find(item => item.productId === productId);
    
    if (existingItem) {
        existingItem.qty += 1;
    } else {
        cart.push({ productId: productId, qty: 1 });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    
    if (typeof updateCartBadge === 'function') updateCartBadge();

    Swal.fire({
        title: 'Thành công!',
        text: 'Đã thêm sản phẩm vào giỏ hàng',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
    });
}