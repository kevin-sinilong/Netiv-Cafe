<?php
require_once 'backend/db_connect.php';
session_start();

// Check if user is logged in and is admin
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    header('Location: index.php');
    exit();
}
?>
<!doctype html>
<html lang="en">

<head>
    <meta charset="utf-8" />
    <title>Netiv Cafe - Admin</title>
    <link rel="stylesheet" href="admin/admin.css" />
</head>

<body>
    <div class="sidebar">
        <h2>Admin</h2>
        <div id="admin-user"><?php echo htmlspecialchars($_SESSION['username'] ?? 'admin'); ?></div>
        <nav>
            <button id="nav-products" class="active">Products</button>
            <button id="nav-inventory">Inventory</button>
            <button id="nav-orders">Sales</button>
            <button id="logout">Logout</button>
        </nav>
    </div>

    <main class="main">
        <section id="page-products" class="page active">
            <h1>Products</h1>
            <div class="card">
                <form id="product-form">
                    <input id="prod-name" placeholder="Product name" required />
                    <input id="prod-price" placeholder="Price" type="number" min="0" step="0.01" required />
                    <input id="prod-qty" placeholder="Quantity" type="number" min="0" required />
                    <button type="submit">Add Product</button>
                </form>
            </div>
            <div class="card">
                <table id="products-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Image</th>
                            <th>Name</th>
                            <th>Price</th>
                            <th>Qty</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        </section>

       <section id="page-inventory" class="page">
    <h1>Inventory Adjustment</h1>
    <div class="card">
        <select id="inv-select">
            <option value="">Select Product</option>
        </select>
        <input id="inv-change" type="number" placeholder="Change (+/-)" />
        <button id="inv-apply">Apply</button>
    </div>
    <div class="card">
        <h3>Current Inventory</h3>
        <table id="inventory-table">
            <thead>
                <tr>
                    <th>Product</th>
                    <th>Current Stock</th>
                    <th>Last Updated</th>
                </tr>
            </thead>
            <tbody></tbody>
                </table>
            </div>
        </section>

        <section id="page-orders" class="page">
            <h1>Sales (Orders)</h1>
            <div class="card">
                <table id="orders-table">
                    <thead>
                        <tr>
                            <th>Order #</th>
                            <th>Cashier</th>
                            <th>Date</th>
                            <th>Items</th>
                            <th>Total</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        </section>
    </main>
    <script src="admin/admin.js"></script>
    
</body>
</html>
