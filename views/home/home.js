// views/home/home.js

const productList = document.getElementById('product-list');
const headerContainer = document.getElementById('header');
const footerContainer = document.getElementById('footer');

// Load Header
async function loadHeader() {
  try {
    const res = await fetch('../layouts/header.html');
    const html = await res.text();
    headerContainer.innerHTML = html;
  } catch (error) {
    console.error('Lỗi load header:', error);
  }
}

// Load Footer
async function loadFooter() {
  try {
    const res = await fetch('../layouts/footer.html');
    const html = await res.text();
    footerContainer.innerHTML = html;
  } catch (error) {
    console.error('Lỗi load footer:', error);
  }
}

// Load Products (Home)
async function loadProducts() {
  try {
    const res = await fetch('http://localhost:5000/api/products');
    const data = await res.json();

    const products = data.products;

    if (!products || products.length === 0) {
      productList.innerHTML = '<p>Không có sản phẩm nào</p>';
      return;
    }

    productList.innerHTML = products.map(product => {
      const imageUrl =
        product.images && product.images.length > 0
          ? product.images[0] // URL Cloudinary
          : '../assets/images/no-image.png';

      return `
        <div class="product-card">
          <img src="${imageUrl}" alt="${product.name}">
          <h3>${product.name}</h3>
          <p class="price">
            ${product.price.toLocaleString('vi-VN')} đ
          </p>
          <button data-id="${product._id}">
            Xem chi tiết
          </button>
        </div>
      `;
    }).join('');

  } catch (error) {
    console.error('Lỗi load sản phẩm:', error);
    productList.innerHTML = '<p>Lỗi tải sản phẩm</p>';
  }
}

// INIT
loadHeader();
loadFooter();
loadProducts();
