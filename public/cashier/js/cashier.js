// cashier.js - WITH SIMPLIFIED RECEIPT (NO CASHIER ID AND NO SUBTOTAL)
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== CASHIER.JS LOADED ===');
    
    // Check session storage
    const userJson = sessionStorage.getItem('user');
    console.log('User data from sessionStorage:', userJson);
    
    if (!userJson) {
        console.log('❌ No user data found - redirecting to login');
        alert('Please login first');
        window.location.href = 'index.php';
        return;
    }
    
    try {
        const user = JSON.parse(userJson);
        console.log('Parsed user object:', user);
        
        if (user.role === 'cashier') {
            console.log('✅ CASHIER ACCESS GRANTED');
            initializeCashierDashboard(user);
        } else {
            console.log('❌ ACCESS DENIED - Not a cashier');
            alert('Access denied. Cashier privileges required.');
            sessionStorage.clear();
            window.location.href = 'index.php';
        }
        
    } catch (error) {
        console.error('Error parsing user data:', error);
        alert('Invalid user data. Please login again.');
        sessionStorage.clear();
        window.location.href = 'index.php';
    }
});

function initializeCashierDashboard(user) {
    console.log('=== INITIALIZING CASHIER DASHBOARD ===');
    
    // Display cashier info
    const cashierUserDiv = document.getElementById('cashier-user');
    if (cashierUserDiv) {
        cashierUserDiv.textContent = `Welcome, ${user.full_name || user.name || 'Cashier'}`;
    }
    
    // Setup functionality
    setupNavigation();
    loadProductsForSale();
    setupCart();
    setupCheckout();
    setupLogout();
}

let cart = [];

function setupNavigation() {
    console.log('Setting up navigation...');
    
    const openOrdersBtn = document.getElementById('open-orders');
    const closeOrdersBtn = document.getElementById('close-orders');
    const ordersModal = document.getElementById('orders-modal');
    
    if (openOrdersBtn && ordersModal) {
        openOrdersBtn.addEventListener('click', () => {
            ordersModal.classList.remove('hidden');
            loadPastOrders();
        });
    }
    
    if (closeOrdersBtn && ordersModal) {
        closeOrdersBtn.addEventListener('click', () => {
            ordersModal.classList.add('hidden');
        });
    }
}

// Load products for the menu
async function loadProductsForSale() {
    console.log('🔄 Loading products for sale...');
    
    try {
        const response = await fetch('backend/products.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'list' })
        });
        
        console.log('Response status:', response.status);
        
        const responseText = await response.text();
        console.log('Raw response:', responseText);
        
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            console.error('JSON parse error:', parseError);
            throw new Error('Invalid JSON from server');
        }
        
        console.log('Products data:', data);
        
        const productsList = document.getElementById('products-list');
        if (!productsList) {
            console.error('❌ products-list element not found!');
            return;
        }
        
        displayProducts(data, productsList);
        
    } catch (error) {
        console.error('❌ Error loading products:', error);
        const productsList = document.getElementById('products-list');
        if (productsList) {
            productsList.innerHTML = '<div class="error">Error loading products</div>';
        }
    }
}

function displayProducts(data, container) {
    console.log('Displaying products in container:', container);
    
    container.innerHTML = '';
    
    if (data.success && data.products && data.products.length > 0) {
        console.log(`✅ Found ${data.products.length} products`);
        
        data.products.forEach(product => {
            const productItem = document.createElement('div');
            productItem.className = 'product-item';
            
            const imageHtml = product.image 
                ? `<img src="uploads/products/${product.image}" alt="${product.name}" class="product-image">` 
                : '<div class="product-image-placeholder">No Image</div>';
            
            productItem.innerHTML = `
                ${imageHtml}
                <div class="product-info">
                    <h4>${product.name}</h4>
                    <p class="price">₱${parseFloat(product.price).toFixed(2)}</p>
                    <p class="stock">Stock: ${product.quantity}</p>
                </div>
                <button class="add-to-cart-btn" 
                        data-id="${product.id}" 
                        data-name="${product.name}" 
                        data-price="${product.price}"
                        data-image="${product.image || ''}"
                        ${product.quantity <= 0 ? 'disabled' : ''}>
                    ${product.quantity <= 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
            `;
            container.appendChild(productItem);
        });
        
        // Attach event listeners
        attachAddToCartListeners();
    } else {
        console.log('❌ No products found');
        container.innerHTML = '<div class="no-products">No products available</div>';
    }
}

function attachAddToCartListeners() {
    console.log('Attaching add to cart listeners...');
    
    document.querySelectorAll('.add-to-cart-btn').forEach(button => {
        button.addEventListener('click', function() {
            if (this.disabled) return;
            
            const productId = this.getAttribute('data-id');
            const productName = this.getAttribute('data-name');
            const productPrice = parseFloat(this.getAttribute('data-price'));
            const productImage = this.getAttribute('data-image');
            
            console.log('Adding to cart:', { productId, productName, productPrice, productImage });
            addToCart(productId, productName, productPrice, productImage);
        });
    });
}

function setupCart() {
    cart = [];
    updateCartDisplay();
}

function addToCart(productId, productName, price, image) {
    // Check if product already in cart
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: productId,
            name: productName,
            price: price,
            image: image || '',
            quantity: 1
        });
    }
    
    updateCartDisplay();
}

function updateCartDisplay() {
    const cartElement = document.getElementById('cart');
    const totalElement = document.getElementById('total');
    
    if (!cartElement || !totalElement) {
        console.log('⚠️ Cart elements not found');
        return;
    }
    
    if (cart.length === 0) {
        cartElement.innerHTML = 'No items yet';
        cartElement.className = 'card empty';
        totalElement.textContent = '0.00';
        return;
    }
    
    let total = 0;
    let cartHTML = '';
    
    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        const imageHtml = item.image 
            ? `<img src="uploads/products/${item.image}" alt="${item.name}" class="cart-item-image">` 
            : '<div class="cart-item-image-placeholder"></div>';
        
        cartHTML += `
            <div class="cart-item">
                ${imageHtml}
                <div class="cart-item-details">
                    <span class="item-name">${item.name}</span>
                    <span class="item-quantity">× ${item.quantity}</span>
                    <span class="item-price">₱${itemTotal.toFixed(2)}</span>
                </div>
                <button class="remove-btn" onclick="removeFromCart(${index})">×</button>
            </div>
        `;
    });
    
    cartElement.innerHTML = cartHTML;
    cartElement.className = 'card';
    totalElement.textContent = total.toFixed(2);
}

// Remove from cart function (needs to be global)
window.removeFromCart = function(index) {
    if (cart[index]) {
        cart.splice(index, 1);
        updateCartDisplay();
    }
};

// Checkout functionality
function setupCheckout() {
    const confirmOrderBtn = document.getElementById('confirm-order');
    const cashPaidInput = document.getElementById('cash-paid');
    
    if (!confirmOrderBtn) {
        console.log('⚠️ Confirm order button not found');
        return;
    }
    
    confirmOrderBtn.addEventListener('click', async function() {
        if (cart.length === 0) {
            alert('Cart is empty!');
            return;
        }
        
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const cashPaid = parseFloat(cashPaidInput?.value || 0);
        
        if (cashPaid < total) {
            alert(`Insufficient payment! Total: ₱${total.toFixed(2)}, Paid: ₱${cashPaid.toFixed(2)}`);
            return;
        }
        
        const change = cashPaid - total;
        
        // Process order
        try {
            const user = JSON.parse(sessionStorage.getItem('user'));
            const response = await fetch('backend/orders.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'create_order',
                    cashier_id: user.cashier_id,
                    items: cart,
                    total: total,
                    cash_received: cashPaid,
                    change: change
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // ✅ SHOW RECEIPT (SIMPLIFIED - NO CASHIER ID AND NO SUBTOTAL)
                showReceipt(cart, total, cashPaid, change, data.order_id);
                
                // Clear cart
                cart = [];
                updateCartDisplay();
                if (cashPaidInput) cashPaidInput.value = '';
                
                // Reload products to update stock
                loadProductsForSale();
                // Reload past orders
                loadPastOrders();
            } else {
                alert('Failed to process order: ' + data.message);
            }
        } catch (error) {
            console.error('Checkout error:', error);
            alert('Error processing order: ' + error.message);
        }
    });
}

// ✅ SIMPLIFIED RECEIPT FUNCTIONALITY (NO CASHIER ID AND NO SUBTOTAL)
function showReceipt(cartItems, total, cashPaid, change, orderId) {
    // Create receipt modal
    const receiptModal = document.createElement('div');
    receiptModal.className = 'modal';
    receiptModal.id = 'receipt-modal';
    receiptModal.innerHTML = `
        <div class="modal-card receipt">
            <div class="receipt-header">
                <h2>NETIV CAFE</h2>
                <p>OFFICIAL RECEIPT</p>
            </div>
            <div class="receipt-info">
                <p><strong>Order #:</strong> ${orderId || 'N/A'}</p>
                <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
            </div>
            <div class="receipt-items">
                <div class="receipt-row header">
                    <span>ITEM</span>
                    <span>QTY</span>
                    <span>PRICE</span>
                    <span>TOTAL</span>
                </div>
                ${cartItems.map(item => `
                    <div class="receipt-row">
                        <span>${item.name}</span>
                        <span>${item.quantity}</span>
                        <span>₱${item.price.toFixed(2)}</span>
                        <span>₱${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                `).join('')}
            </div>
            <div class="receipt-totals">
                <!-- SUBTOTAL REMOVED FROM HERE -->
                <div class="receipt-row">
                    <span colspan="3">CASH PAID:</span>
                    <span>₱${cashPaid.toFixed(2)}</span>
                </div>
                <div class="receipt-row">
                    <span colspan="3">CHANGE:</span>
                    <span>₱${change.toFixed(2)}</span>
                </div>
                <div class="receipt-row total">
                    <span colspan="3"><strong>TOTAL AMOUNT:</strong></span>
                    <span><strong>₱${total.toFixed(2)}</strong></span>
                </div>
            </div>
            <div class="receipt-footer">
                <p>*** THANK YOU! ***</p>
                <p>Please come again!</p>
            </div>
            <div class="receipt-actions">
                <button onclick="printReceipt()" class="btn-primary">🖨️ Print Receipt</button>
                <button onclick="closeReceipt()" class="btn-secondary">Close</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(receiptModal);
}

// ✅ PRINT RECEIPT FUNCTION (WITHOUT SUBTOTAL)
window.printReceipt = function() {
    const receiptElement = document.querySelector('.receipt');
    if (receiptElement) {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Receipt - Netiv Cafe</title>
                <style>
                    body { 
                        font-family: 'Courier New', monospace; 
                        margin: 0; 
                        padding: 20px;
                        font-size: 14px;
                        background: white;
                    }
                    .receipt { 
                        width: 300px; 
                        margin: 0 auto; 
                        border: 2px solid #000;
                        padding: 15px;
                    }
                    .receipt-header { 
                        text-align: center; 
                        border-bottom: 2px dashed #000; 
                        padding-bottom: 10px; 
                        margin-bottom: 10px; 
                    }
                    .receipt-header h2 { 
                        margin: 0; 
                        font-size: 18px; 
                    }
                    .receipt-info { 
                        margin-bottom: 10px; 
                        font-size: 12px;
                    }
                    .receipt-row { 
                        display: flex; 
                        justify-content: space-between; 
                        margin-bottom: 5px; 
                        font-size: 12px;
                    }
                    .receipt-row.header { 
                        border-bottom: 1px solid #000; 
                        font-weight: bold; 
                        margin-bottom: 8px;
                    }
                    .receipt-row.total { 
                        border-top: 2px dashed #000; 
                        padding-top: 8px; 
                        font-weight: bold; 
                        font-size: 14px;
                    }
                    .receipt-totals { 
                        border-top: 1px solid #000; 
                        padding-top: 10px; 
                        margin-top: 10px; 
                    }
                    .receipt-footer { 
                        text-align: center; 
                        margin-top: 15px; 
                        border-top: 2px dashed #000; 
                        padding-top: 10px; 
                        font-style: italic;
                    }
                    .receipt-actions { 
                        display: none; 
                    }
                    @media print {
                        body { margin: 0; padding: 0; }
                        .receipt { border: none; padding: 10px; }
                    }
                </style>
            </head>
            <body>
                ${receiptElement.outerHTML}
                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(() => window.close(), 1000);
                    };
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    }
};

// ✅ CLOSE RECEIPT FUNCTION
window.closeReceipt = function() {
    const receiptModal = document.getElementById('receipt-modal');
    if (receiptModal) {
        receiptModal.remove();
    }
};

// Load past orders
async function loadPastOrders() {
    console.log('Loading past orders...');
    
    try {
        const user = JSON.parse(sessionStorage.getItem('user'));
        const response = await fetch('backend/orders.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                action: 'list_cashier_orders',
                cashier_id: user.cashier_id 
            })
        });
        
        const data = await response.json();
        console.log('Past orders data:', data);
        
        const pastOrdersList = document.getElementById('past-orders-list');
        if (!pastOrdersList) return;
        
        pastOrdersList.innerHTML = '';
        
        if (data.success && data.orders && data.orders.length > 0) {
            data.orders.forEach(order => {
                const orderItem = document.createElement('div');
                orderItem.className = 'order-item';
                orderItem.innerHTML = `
                    <div class="order-header">
                        <strong>Order #${order.order_id}</strong>
                        <span>${order.order_date || new Date().toLocaleDateString()}</span>
                    </div>
                    <div class="order-total">Total: ₱${order.total ? parseFloat(order.total).toFixed(2) : '0.00'}</div>
                    <div class="order-cash">Cash: ₱${order.cash_received ? parseFloat(order.cash_received).toFixed(2) : '0.00'}</div>
                    <div class="order-change">Change: ₱${order.change_given ? parseFloat(order.change_given).toFixed(2) : '0.00'}</div>
                `;
                pastOrdersList.appendChild(orderItem);
            });
        } else {
            pastOrdersList.innerHTML = '<div class="no-orders">No past orders found</div>';
        }
    } catch (error) {
        console.error('Error loading past orders:', error);
        const pastOrdersList = document.getElementById('past-orders-list');
        if (pastOrdersList) {
            pastOrdersList.innerHTML = '<div class="error">Error loading orders</div>';
        }
    }
}

function setupLogout() {
    const logoutBtn = document.getElementById('logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            sessionStorage.clear();
            window.location.href = 'index.php';
        });
    }
}