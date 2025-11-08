// admin.js - FIXED PRODUCTS DISPLAY
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== ADMIN.JS LOADED ===');
    
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
        
        if (user.role === 'admin') {
            console.log('✅ ADMIN ACCESS GRANTED');
            initializeDashboard(user);
        } else {
            console.log('❌ ACCESS DENIED - Not an admin');
            alert('Access denied. Admin privileges required.');
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

function initializeDashboard(user) {
    console.log('=== INITIALIZING DASHBOARD ===');
    
    // Display admin info
    const adminUserDiv = document.getElementById('admin-user');
    if (adminUserDiv) {
        adminUserDiv.textContent = `Welcome, ${user.full_name || user.name || 'Admin'}`;
    }
    
    // Load products by default
    fetchProducts();
    
    // Setup navigation
    setupNavigation();
    setupAddProductForm();
    setupLogout();
}

function setupNavigation() {
    console.log('Setting up navigation...');
    
    const navProducts = document.getElementById('nav-products');
    const navInventory = document.getElementById('nav-inventory');
    const navOrders = document.getElementById('nav-orders');
    
    if (navProducts) {
        navProducts.addEventListener('click', function(e) {
            e.preventDefault();
            showPage('page-products');
            fetchProducts();
        });
    }
    
    if (navInventory) {
        navInventory.addEventListener('click', function(e) {
            e.preventDefault();
            showPage('page-inventory');
            loadInventory();
        });
    }
    
    if (navOrders) {
        navOrders.addEventListener('click', function(e) {
            e.preventDefault();
            showPage('page-orders');
            fetchOrders();
        });
    }
}

function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Remove active class from all nav buttons
    document.querySelectorAll('.sidebar nav button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show target page and activate nav button
    const targetPage = document.getElementById(pageId);
    const targetNav = document.getElementById('nav-' + pageId.replace('page-', ''));
    
    if (targetPage) targetPage.classList.add('active');
    if (targetNav) targetNav.classList.add('active');
}

// ---------- PRODUCT MANAGEMENT ----------
function setupAddProductForm() {
    const form = document.getElementById('product-form');
    if (!form) {
        console.error('Product form not found!');
        return;
    }
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('Add product form submitted');
        
        const name = document.getElementById('prod-name').value.trim();
        const price = parseFloat(document.getElementById('prod-price').value);
        const qty = parseInt(document.getElementById('prod-qty').value);
        
        if (!name || isNaN(price) || price <= 0 || isNaN(qty) || qty < 0) {
            alert('Please fill all fields correctly');
            return;
        }
        
        try {
            console.log('Sending product data:', { product_name: name, price: price, quantity: qty });
            
            const response = await fetch('backend/products.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: 'add_product',  // ✅ CORRECT ACTION NAME
                    product_name: name,
                    price: price,
                    quantity: qty
                })
            });
            
            console.log('Response status:', response.status);
            
            const data = await response.json();
            console.log('Add product response:', data);
            
            if (data.success) {
                alert('Product added successfully!');
                form.reset();
                fetchProducts(); // Refresh the products list
            } else {
                alert('Failed to add product: ' + (data.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error adding product:', error);
            alert('Error adding product: ' + error.message);
        }
    });
}

// ✅ FIXED: fetchProducts function
async function fetchProducts() {
    console.log('🔄 Fetching products...');
    
    try {
        const response = await fetch('backend/products.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'list' })
        });
        
        console.log('Products response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const responseText = await response.text();
        console.log('Raw products response:', responseText);
        
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            console.error('JSON parse error:', parseError);
            throw new Error('Invalid JSON from server');
        }
        
        console.log('Products data:', data);
        
        const tbody = document.querySelector('#products-table tbody');
        if (!tbody) {
            console.error('Products table body not found!');
            return;
        }
        
        tbody.innerHTML = '';
        
        if (data.success && data.products && data.products.length > 0) {
            console.log(` Found ${data.products.length} products`);
            
            data.products.forEach(product => {
                const row = document.createElement('tr');
                const imageHtml = product.image 
                    ? `<img src="uploads/products/${product.image}" alt="${product.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;">` 
                    : '<span style="color: #999;">No image</span>';
                    
                row.innerHTML = `
                    <td>${product.id || 'N/A'}</td>
                    <td>${imageHtml}</td>
                    <td>${product.name || 'Unnamed'}</td>
                    <td>₱${parseFloat(product.price || 0).toFixed(2)}</td>
                    <td>${product.quantity || product.stock_qty || 0}</td>
                    <td>
                        <button class="edit-btn" data-id="${product.id}">Edit</button>
                        <button class="delete-btn" data-id="${product.id}">Delete</button>
                        <button class="upload-img-btn" data-id="${product.id}" data-name="${product.name}">📷 Image</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
            
            // Attach event listeners to buttons
            attachProductButtonListeners();
        } else {
            console.log('❌ No products found or empty response');
            tbody.innerHTML = '<tr><td colspan="5" class="no-data">No products found in database</td></tr>';
        }
    } catch (error) {
        console.error('❌ Error fetching products:', error);
        const tbody = document.querySelector('#products-table tbody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="5" class="error">Error loading products: ' + error.message + '</td></tr>';
        }
    }
}

function attachProductButtonListeners() {
    console.log('Attaching product button listeners...');
    
    // Edit buttons
    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.getAttribute('data-id');
            console.log('Edit product:', productId);
            editProduct(productId);
        });
    });
    
    // Delete buttons
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.getAttribute('data-id');
            console.log('Delete product:', productId);
            deleteProduct(productId);
        });
    });
    
    // Image upload buttons
    document.querySelectorAll('.upload-img-btn').forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.getAttribute('data-id');
            const productName = this.getAttribute('data-name');
            console.log('Upload image for product:', productId);
            uploadProductImage(productId, productName);
        });
    });
}

async function editProduct(productId) {
    if (!productId) return;
    
    try {
        const row = document.querySelector(`.edit-btn[data-id="${productId}"]`).closest('tr');
        const currentName = row.cells[1].textContent;
        const currentPrice = row.cells[2].textContent.replace('₱', '');
        const currentQty = row.cells[3].textContent;
        
        const newName = prompt('Enter new product name:', currentName);
        if (newName === null) return;
        
        const newPrice = prompt('Enter new price:', currentPrice);
        if (newPrice === null) return;
        
        const newQty = prompt('Enter new quantity:', currentQty);
        if (newQty === null) return;
        
        if (!newName.trim()) {
            alert('Product name cannot be empty');
            return;
        }
        
        const priceNum = parseFloat(newPrice);
        const qtyNum = parseInt(newQty);
        
        if (isNaN(priceNum) || priceNum <= 0 || isNaN(qtyNum) || qtyNum < 0) {
            alert('Please enter valid price and quantity');
            return;
        }

        console.log('🔄 Editing product:', { productId, newName, priceNum, qtyNum });
        
        const response = await fetch('backend/products.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'edit_product',
                product_id: productId,
                product_name: newName.trim(),
                price: priceNum,
                quantity: qtyNum
            })
        });

        console.log('Edit response status:', response.status);
        
        const responseText = await response.text();
        console.log('Edit raw response:', responseText);
        
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            console.error('JSON parse error:', parseError);
            throw new Error('Invalid JSON from server: ' + responseText.substring(0, 200));
        }
        
        console.log('Edit parsed data:', data);
        alert(data.message || (data.success ? 'Product updated!' : 'Failed to update product'));
        
        if (data.success) {
            fetchProducts();
        }
    } catch (error) {
        console.error('Error editing product:', error);
        alert('Error editing product: ' + error.message);
    }
}

async function deleteProduct(productId) {
    if (!productId) return;
    
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
        console.log('🗑️ Deleting product:', productId);
        
        const response = await fetch('backend/products.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'delete_product',
                product_id: productId
            })
        });

        console.log('Delete response status:', response.status);
        
        const responseText = await response.text();
        console.log('Delete raw response:', responseText);
        
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            console.error('JSON parse error:', parseError);
            throw new Error('Invalid JSON from server: ' + responseText.substring(0, 200));
        }
        
        console.log('Delete parsed data:', data);
        alert(data.message || (data.success ? 'Product deleted!' : 'Failed to delete product'));
        
        if (data.success) {
            fetchProducts();
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        alert('Error deleting product: ' + error.message);
    }
}

// ---------- INVENTORY MANAGEMENT ----------
async function loadInventory() {
    console.log('Loading inventory...');
    try {
        const response = await fetch('backend/products.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'list' })
        });
        
        const data = await response.json();
        console.log('Inventory data:', data);
        
        const inventoryTbody = document.querySelector('#inventory-table tbody');
        const invSelect = document.getElementById('inv-select');
        
        if (!inventoryTbody || !invSelect) {
            console.error('Inventory elements not found!');
            return;
        }
        
        // Clear existing
        inventoryTbody.innerHTML = '';
        invSelect.innerHTML = '<option value="">Select Product</option>';
        
        if (data.success && data.products && data.products.length > 0) {
            console.log('Inventory products:', data.products);
            data.products.forEach(product => {
                console.log('Processing product:', product);
                // Add to select dropdown
                const option = document.createElement('option');
                option.value = product.id;
                option.textContent = product.name;
                invSelect.appendChild(option);
                
                // Add to table
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${product.name || 'Unknown'}</td>
                    <td>${product.quantity || 0}</td>
                    <td>${new Date().toLocaleDateString()}</td>
                `;
                inventoryTbody.appendChild(row);
            });
            
            setupInventoryButton();
        } else {
            inventoryTbody.innerHTML = '<tr><td colspan="3">No products found</td></tr>';
        }
    } catch (error) {
        console.error('Error loading inventory:', error);
    }
}

// Track if inventory button is already set up
let inventoryButtonSetup = false;

function setupInventoryButton() {
    // Only setup once to prevent multiple event listeners
    if (inventoryButtonSetup) return;
    
    const applyBtn = document.getElementById('inv-apply');
    if (!applyBtn) return;
    
    applyBtn.addEventListener('click', async function() {
        const productSelect = document.getElementById('inv-select');
        const changeInput = document.getElementById('inv-change');
        
        const productId = productSelect.value;
        const change = parseInt(changeInput.value);
        
        if (!productId) {
            alert('Please select a product');
            return;
        }
        
        if (isNaN(change)) {
            alert('Please enter a valid quantity change');
            return;
        }
        
        // Disable button to prevent double clicks
        applyBtn.disabled = true;
        
        try {
            const response = await fetch('backend/products.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'adjust_inventory',
                    product_id: productId,
                    quantity_change: change
                })
            });
            
            const data = await response.json();
            alert(data.message || (data.success ? 'Inventory adjusted!' : 'Failed to adjust inventory'));
            
            if (data.success) {
                changeInput.value = '';
                loadInventory();
            }
        } catch (error) {
            console.error('Error adjusting inventory:', error);
            alert('Error adjusting inventory: ' + error.message);
        } finally {
            // Re-enable button
            applyBtn.disabled = false;
        }
    });
    
    inventoryButtonSetup = true;
}

// ---------- ORDERS MANAGEMENT ----------
async function fetchOrders() {
    console.log('Fetching orders...');
    try {
        const response = await fetch('backend/orders.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'list_all_orders' })
        });
        
        const data = await response.json();
        console.log('Orders data:', data);
        
        const tbody = document.querySelector('#orders-table tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (data.success && data.orders && data.orders.length > 0) {
            data.orders.forEach(order => {
                // Format items list
                let itemsList = 'N/A';
                if (order.items && order.items.length > 0) {
                    itemsList = order.items.map(item => 
                        `${item.product_name} (${item.quantity})`
                    ).join(', ');
                }
                
                // Format date
                const orderDate = new Date(order.created_at).toLocaleString();
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>#${order.id}</td>
                    <td>${order.cashier_name || 'N/A'}</td>
                    <td>${orderDate}</td>
                    <td>${itemsList}</td>
                    <td>₱${parseFloat(order.total_amount || 0).toFixed(2)}</td>
                    <td><span class="status-badge status-${order.status}">${order.status}</span></td>
                `;
                tbody.appendChild(row);
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #999;">No orders found</td></tr>';
        }
    } catch (error) {
        console.error('Error fetching orders:', error);
        const tbody = document.querySelector('#orders-table tbody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: red;">Error loading orders</td></tr>';
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

// Image upload function
function uploadProductImage(productId, productName) {
    // Create file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            alert('File too large! Maximum size is 5MB');
            return;
        }
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }
        
        const formData = new FormData();
        formData.append('image', file);
        formData.append('product_id', productId);
        
        try {
            console.log('Uploading image for product:', productId);
            
            const response = await fetch('backend/upload_image.php', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            console.log('Upload response:', data);
            
            if (data.success) {
                alert(`Image uploaded successfully for ${productName}!`);
                fetchProducts(); // Refresh the product list
            } else {
                alert('Upload failed: ' + data.message);
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Error uploading image: ' + error.message);
        }
    };
    
    // Trigger file selection
    input.click();
}