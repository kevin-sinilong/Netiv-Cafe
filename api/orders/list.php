<?php
// API: List all orders (Admin)
require_once '../config/database.php';

try {
    $stmt = $pdo->query("
        SELECT 
            o.id,
            o.total_amount,
            o.cash_paid,
            o.change_amount,
            o.status,
            o.created_at,
            u.username as cashier_name
        FROM orders o
        JOIN users u ON o.cashier_id = u.id
        ORDER BY o.created_at DESC
        LIMIT 100
    ");
    $orders = $stmt->fetchAll();
    
    // Get items for each order
    foreach($orders as &$order) {
        $stmt = $pdo->prepare("
            SELECT 
                oi.quantity,
                oi.price_per_item,
                oi.subtotal,
                p.name as product_name
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = ?
        ");
        $stmt->execute([$order['id']]);
        $order['items'] = $stmt->fetchAll();
    }
    
    sendResponse([
        'success' => true,
        'orders' => $orders
    ]);
    
} catch(PDOException $e) {
    sendResponse([
        'success' => false,
        'message' => 'Error fetching orders: ' . $e->getMessage()
    ], 500);
}
?>
