<?php
// API: Create new order
require_once '../config/database.php';
session_start();

$input = getJsonInput();
$cashierId = $_SESSION['user_id'] ?? $input['cashier_id'] ?? null;
$items = $input['items'] ?? [];
$total = $input['total'] ?? 0;
$cashPaid = $input['cash_received'] ?? 0;
$change = $input['change'] ?? 0;

if (!$cashierId) {
    sendResponse([
        'success' => false,
        'message' => 'Cashier ID is required'
    ], 400);
}

if (empty($items)) {
    sendResponse([
        'success' => false,
        'message' => 'No items in order'
    ], 400);
}

$pdo->beginTransaction();

try {
    // Validate and update product stock
    foreach($items as $item) {
        $stmt = $pdo->prepare("SELECT quantity FROM products WHERE id = ?");
        $stmt->execute([$item['id']]);
        $product = $stmt->fetch();
        
        if (!$product) {
            throw new Exception('Product not found: ' . $item['id']);
        }
        
        if ($product['quantity'] < $item['quantity']) {
            throw new Exception('Insufficient stock for: ' . ($item['name'] ?? 'product'));
        }
        
        // Update stock
        $stmt = $pdo->prepare("UPDATE products SET quantity = quantity - ? WHERE id = ?");
        $stmt->execute([$item['quantity'], $item['id']]);
    }
    
    // Create order
    $stmt = $pdo->prepare("INSERT INTO orders (cashier_id, total_amount, cash_paid, change_amount, status, created_at) 
                           VALUES (?, ?, ?, ?, 'completed', NOW())");
    $stmt->execute([$cashierId, $total, $cashPaid, $change]);
    $orderId = $pdo->lastInsertId();
    
    // Create order items
    $stmt = $pdo->prepare("INSERT INTO order_items (order_id, product_id, quantity, price_per_item, subtotal) 
                           VALUES (?, ?, ?, ?, ?)");
    
    foreach($items as $item) {
        $subtotal = $item['price'] * $item['quantity'];
        $stmt->execute([
            $orderId,
            $item['id'],
            $item['quantity'],
            $item['price'],
            $subtotal
        ]);
    }
    
    $pdo->commit();
    
    sendResponse([
        'success' => true,
        'message' => 'Order created successfully',
        'order_id' => $orderId
    ]);
    
} catch(Exception $e) {
    $pdo->rollBack();
    sendResponse([
        'success' => false,
        'message' => 'Order failed: ' . $e->getMessage()
    ], 500);
}
?>
