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
        
        const userStr = localStorage.getItem('user');
        console.log("1. Dữ liệu trong LocalStorage:", userStr); 
        
        if (userStr) {
            const user = JSON.parse(userStr);
            console.log("2. Quyền isSeller của tài khoản này là:", user.isSeller); 

            if (user.isSeller === true) {
                const sellerLink = document.getElementById('link-seller-center');
                if (sellerLink) {
                    sellerLink.style.display = 'flex'; 
                    console.log("3. ĐÃ BẬT HIỂN THỊ NÚT KÊNH NGƯỜI BÁN THÀNH CÔNG!");
                } else {
                    console.log("3. LỖI: Không tìm thấy ID link-seller-center trong HTML");
                }
            }
        }
    });

    fetch('../layouts/footer.html').then(res => res.text()).then(html => {
        footerContainer.innerHTML = html;
    });

    loadProducts();
});

async function loadProducts() {
    const productList = document.getElementById('product-list');
    const paginationEl = document.getElementById('pagination');

    productList.innerHTML = '<p style="width:100%; text-align:center; color:#666;"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải dữ liệu...</p>';

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
