let cartBody;
let totalPriceEl;
let cartFooter;
let cartTable;

document.addEventListener('DOMContentLoaded', () => {
    cartBody = document.getElementById('cart-body');
    totalPriceEl = document.getElementById('total-price');
    cartFooter = document.getElementById('cart-footer');
    cartTable = document.getElementById('cart-table');
    
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
        } catch (e) { console.error("Lỗi load layout:", e); }
    }

    loadLayout();
    loadCart(); 
});

async function loadCart() {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    if (cart.length === 0) {
        showEmptyCart();
        return;
    }

    try {
        const cartDetails = await Promise.all(cart.map(async (item) => {
            try {
                const res = await fetch(`http://localhost:5000/api/products/${item.productId}`);
                if (!res.ok) return null; 
                
                const data = await res.json();
                const product = data.product || data; 
                
                return { ...product, qty: item.qty };
            } catch (err) {
                return null;
            }
        }));

        const validItems = cartDetails.filter(item => item !== null);

        if (validItems.length !== cart.length) {
            const newCart = validItems.map(i => ({ productId: i._id, qty: i.qty }));
            localStorage.setItem('cart', JSON.stringify(newCart));
        }

        if (validItems.length === 0) {
            showEmptyCart();
            return;
        }

        cartTable.style.display = 'table';
        cartFooter.style.display = 'flex';
        renderCart(validItems);

    } catch (error) {
        console.error("Lỗi tải giỏ hàng:", error);
        cartBody.innerHTML = '<tr><td colspan="5" style="color:red; text-align:center">Lỗi kết nối Server</td></tr>';
    }
}

function renderCart(items) {
    let total = 0;
    cartBody.innerHTML = items.map(item => {
        const subtotal = item.price * item.qty;
        total += subtotal;
        
        const imgUrl = item.images && item.images.length > 0 ? item.images[0] : 'https://via.placeholder.com/80';

        return `
            <tr>
                <td>
                    <div class="product-col">
                        <img src="${imgUrl}" class="cart-img" alt="${item.name}">
                        <span class="product-name">${item.name}</span>
                    </div>
                </td>
                <td class="item-price">${item.price.toLocaleString('vi-VN')} đ</td>
                <td style="text-align: center;">
                    <input type="number" class="qty-input" value="${item.qty}" min="1" 
                           onchange="updateQty('${item._id}', this.value)">
                </td>
                <td class="item-subtotal">
                    ${subtotal.toLocaleString('vi-VN')} đ
                </td>
                <td style="text-align: center;">
                    <button class="btn-remove" onclick="removeItem('${item._id}')" title="Xóa sản phẩm">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    totalPriceEl.innerText = total.toLocaleString('vi-VN') + ' đ';
    localStorage.setItem('cartTotal', total); 
}

function showEmptyCart() {
    cartTable.style.display = 'none';
    cartFooter.style.display = 'none';
    document.querySelector('.cart-container').innerHTML += `
        <div class="empty-cart">
            <i class="fa-solid fa-cart-arrow-down"></i>
            <h3>Giỏ hàng của bạn đang trống</h3>
            <p>Vẫn còn rất nhiều sản phẩm hấp dẫn đang chờ bạn.</p>
            <a href="../home/index.html" class="btn-continue">Tiếp tục mua sắm</a>
        </div>
    `;
}

function updateQty(productId, newQty) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const item = cart.find(i => i.productId === productId);
    
    if (item) {
        item.qty = parseInt(newQty);
        if (item.qty <= 0) item.qty = 1; 
        localStorage.setItem('cart', JSON.stringify(cart));
        
        loadCart(); 
        if(typeof updateCartBadge === 'function') updateCartBadge();
    }
}

function removeItem(productId) {
    Swal.fire({
        title: 'Bỏ sản phẩm?',
        text: "Bạn có chắc muốn bỏ sản phẩm này khỏi giỏ hàng?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Đồng ý xóa',
        cancelButtonText: 'Hủy'
    }).then((result) => {
        if (result.isConfirmed) {
            let cart = JSON.parse(localStorage.getItem('cart')) || [];
            cart = cart.filter(i => i.productId !== productId);
            localStorage.setItem('cart', JSON.stringify(cart));
            
            loadCart();
            if(typeof updateCartBadge === 'function') updateCartBadge();
            
            Swal.fire({
                title: 'Đã xóa!',
                text: 'Sản phẩm đã được xóa khỏi giỏ hàng.',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
        }
    });
}