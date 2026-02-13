// --- 1. KHAI BÁO BIẾN TOÀN CỤC (Lưu trạng thái lọc) ---
let currentPage = 1;
let currentKeyword = '';
let currentSort = '-createdAt';
let currentMinPrice = '';
let currentMaxPrice = '';
let currentBrand = '';

document.addEventListener('DOMContentLoaded', () => {
    const headerContainer = document.getElementById('header');
    const footerContainer = document.getElementById('footer');

    fetch('../layouts/header.html').then(res => res.text()).then(html => {
        headerContainer.innerHTML = html;
        if (typeof checkLoginState === 'function') checkLoginState();
    });

    fetch('../layouts/footer.html').then(res => res.text()).then(html => {
        footerContainer.innerHTML = html;
    });

    loadProducts();
});

async function loadProducts() {
    const productList = document.getElementById('product-list');
    const paginationEl = document.getElementById('pagination');

    productList.innerHTML = '<p style="width:100%; text-align:center">⏳ Đang tải dữ liệu...</p>';

    try {
        let url = `http://localhost:5000/api/products?page=${currentPage}&limit=8&sort=${currentSort}`;

        if (currentKeyword) url += `&keyword=${currentKeyword}`;

        if (currentBrand) url += `&brand=${currentBrand}`;

        if (currentMinPrice) url += `&price[gte]=${currentMinPrice}`;
        if (currentMaxPrice) url += `&price[lte]=${currentMaxPrice}`;

        const res = await fetch(url);
        const data = await res.json();

        if (data.products && data.products.length > 0) {
            renderProducts(data.products);
            renderPagination(data.totalPages, data.currentPage);
        } else {
            productList.innerHTML = '<p style="width:100%; text-align:center">Không tìm thấy sản phẩm nào phù hợp.</p>';
            paginationEl.innerHTML = ''; 
        }

    } catch (error) {
        console.error('Lỗi tải sản phẩm:', error);
        productList.innerHTML = '<p style="color:red; text-align:center">Lỗi kết nối Server!</p>';
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
            <div class="product-card">
                <img src="${imageUrl}" alt="${product.name}">
                <h3 style="height: 40px; overflow: hidden; margin-top: 10px;">${product.name}</h3>
                <p class="price">${price} đ</p>
                
                <div class="action-buttons">
                    <a href="product-detail.html?id=${product._id}" class="btn-filter" style="text-decoration: none; font-size: 0.9em; padding: 8px 12px;">
                        Xem
                    </a>
                    
                    <button class="btn-filter" style="background: #28a745;" onclick="addToCart('${product._id}')">
                        + Giỏ
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function renderPagination(totalPages, page) {
    const paginationEl = document.getElementById('pagination');
    let html = '';

    if (page > 1) {
        html += `<button onclick="changePage(${page - 1})">« Trước</button>`;
    }

    for (let i = 1; i <= totalPages; i++) {
        const activeStyle = i === page ? 'background:#007bff; color:white; border-color:#007bff;' : '';
        html += `<button onclick="changePage(${i})" style="${activeStyle}">${i}</button>`;
    }

    if (page < totalPages) {
        html += `<button onclick="changePage(${page + 1})">Sau »</button>`;
    }

    paginationEl.innerHTML = html;
}

function applyFilters() {
    currentKeyword = document.getElementById('search-keyword').value.trim();
    currentSort = document.getElementById('sort-by').value;
    currentBrand = document.getElementById('filter-brand').value;
    const priceRange = document.getElementById('filter-price').value;

    if (priceRange) {
        const [min, max] = priceRange.split('-');
        currentMinPrice = min;
        currentMaxPrice = max;
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
    document.getElementById('header').scrollIntoView({ behavior: 'smooth' });
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
    alert('Đã thêm sản phẩm vào giỏ hàng!');
}