document.addEventListener('DOMContentLoaded', () => {
    const cartBody = document.getElementById('cart-body');
    const totalPriceEl = document.getElementById('total-price');
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

    async function loadCart() {
        let cart = JSON.parse(localStorage.getItem('cart')) || [];

        if (cart.length === 0) {
            cartBody.innerHTML = '<tr><td colspan="5" style="text-align:center">Giỏ hàng trống</td></tr>';
            totalPriceEl.innerText = '0 đ';
            return;
        }

        try {
            const cartDetails = await Promise.all(cart.map(async (item) => {
                try {
                    const res = await fetch(`http://localhost:5000/api/products/${item.productId}`);
                    if (!res.ok) return null; 
                    
                    const data = await res.json();

                    const product = data.product || data; 
                    
                    return { 
                        ...product, 
                        qty: item.qty 
                    };
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
                cartBody.innerHTML = '<tr><td colspan="5" style="text-align:center">Giỏ hàng trống</td></tr>';
                totalPriceEl.innerText = '0 đ';
                return;
            }

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
            
            const imgUrl = item.images && item.images.length > 0 ? item.images[0] : 'https://via.placeholder.com/50';

            return `
                <tr>
                    <td style="display: flex; align-items: center; gap: 10px;">
                        <img src="${imgUrl}" class="cart-img">
                        <span>${item.name}</span>
                    </td>
                    <td>${item.price.toLocaleString('vi-VN')} đ</td>
                    <td>
                        <input type="number" class="qty-input" value="${item.qty}" min="1" 
                               onchange="updateQty('${item._id}', this.value)">
                    </td>
                    <td style="color: #d32f2f; font-weight: bold;">
                        ${subtotal.toLocaleString('vi-VN')} đ
                    </td>
                    <td>
                        <button class="btn-remove" onclick="removeItem('${item._id}')">Xóa</button>
                    </td>
                </tr>
            `;
        }).join('');

        totalPriceEl.innerText = total.toLocaleString('vi-VN') + ' đ';
        localStorage.setItem('cartTotal', total); 
    }

    loadLayout();
    loadCart();
});


function updateQty(productId, newQty) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const item = cart.find(i => i.productId === productId);
    
    if (item) {
        item.qty = parseInt(newQty);
        if (item.qty <= 0) item.qty = 1; 
        localStorage.setItem('cart', JSON.stringify(cart));
        location.reload(); 
    }
}

function removeItem(productId) {
    if(!confirm("Bạn chắc chắn muốn xóa sản phẩm này?")) return;
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart = cart.filter(i => i.productId !== productId);
    localStorage.setItem('cart', JSON.stringify(cart));
    location.reload();
}