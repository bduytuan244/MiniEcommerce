document.addEventListener('DOMContentLoaded', () => {
    const productList = document.getElementById('product-list');
    const headerContainer = document.getElementById('header');
    const footerContainer = document.getElementById('footer');

    // 1. Load Header
    async function loadHeader() {
        try {
            const res = await fetch('../layouts/header.html'); 
            if (res.ok) {
                const html = await res.text();
                headerContainer.innerHTML = html;
                
                checkLoginState(); 
            } else {
                console.error('Không tìm thấy file header');
            }
        } catch (error) {
            console.error('Lỗi load header:', error);
        }
    }

    // 2. Load Footer
    async function loadFooter() {
        try {
            const res = await fetch('../layouts/footer.html');
            if (res.ok) {
                footerContainer.innerHTML = await res.text();
            }
        } catch (error) {
            console.error('Lỗi load footer:', error);
        }
    }

    // 3. Load Products
    async function loadProducts() {
        try {
            const res = await fetch('http://localhost:5000/api/products');
            const data = await res.json();
            
            const products = data.products || []; 

            if (products.length === 0) {
                productList.innerHTML = '<p style="text-align:center; width:100%">Không có sản phẩm nào</p>';
                return;
            }

            productList.innerHTML = products.map(product => {
                const imageUrl = product.images && product.images.length > 0 
                    ? product.images[0] 
                    : 'https://via.placeholder.com/300x200?text=No+Image';

                const price = product.price.toLocaleString('vi-VN');

                return `
                    <div class="product-card">
                        <img src="${imageUrl}" alt="${product.name}">
                        <h3>${product.name}</h3>
                        <p class="price">${price} đ</p>
                        
                        <div class="action-buttons">
                            <a href="product-detail.html?id=${product._id}" class="btn-detail">
                                Xem chi tiết
                            </a>
                            
                            <button class="btn-add-cart" onclick="addToCart('${product._id}')">
                                🛒 Thêm
                            </button>
                        </div>
                    </div>
                `;
            }).join('');

        } catch (error) {
            console.error('Lỗi load sản phẩm:', error);
            productList.innerHTML = '<p style="color:red; text-align:center">Lỗi kết nối tới Server!</p>';
        }
    }

    loadHeader();
    loadFooter();
    loadProducts();
});



// 4. Hàm Thêm vào giỏ
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

// 5. Hàm Check Login & Xử lý Đăng xuất
function checkLoginState() {
    const user = localStorage.getItem('user');

    const loginLink = document.querySelector('nav a[href*="login"]'); 
    
    if (user && loginLink) {
        const userData = JSON.parse(user);
        
        loginLink.innerHTML = `👋 Xin chào, ${userData.name} (Thoát)`;
        loginLink.href = "#"; 
        
        loginLink.addEventListener('click', (e) => {
            e.preventDefault();
            
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            
            alert('Đã đăng xuất thành công!');
            window.location.reload(); 
        });
    }
}