<?php
require_once 'backend/db_connect.php';
session_start();

// Check if user is logged in and is cashier
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'cashier') {
    header('Location: index.php');
    exit();
}
?>
<!doctype html>
<html lang="en">

<head>
    <meta charset="utf-8" />
    <title>Netiv Cafe - Cashier</title>
    <link rel="stylesheet" href="cashier/cashier.css" />
</head>

<body>
    <header>
        <div class="left">
            <h2>Netiv Cafe - Cashier</h2>
            <div id="cashier-user"><?php echo htmlspecialchars($_SESSION['username'] ?? 'cashier'); ?></div>
        </div>
        <div class="right">
            <button id="open-orders">Open Orders</button>
            <button id="logout">Logout</button>
        </div>
    </header>

    <main class="main">
        <aside class="menu">
            <h3>Menu</h3>
            <div id="products-list"></div>
        </aside>
        <section class="pos">
            <h3>Current Order</h3>
            <div id="cart" class="card empty">No items yet</div>
            <div class="row checkout">
                <div>Total: ₱ <span id="total">0.00</span></div>
                <div>
                    <input id="cash-paid" type="number" placeholder="Cash paid" />
                    <button id="confirm-order">Checkout</button>
                </div>
            </div>
        </section>
    </main>

    <div id="orders-modal" class="modal hidden">
        <div class="modal-card">
            <h3>Past Orders</h3>
            <div id="past-orders-list"></div>
            <button id="close-orders">Close</button>
        </div>
    </div>

    <script src="cashier/cashier.js"></script>
</body>

</html>
