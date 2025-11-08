<?php
// API: Adjust product inventory
require_once '../config/database.php';

$input = getJsonInput();
$productId = $input['product_id'] ?? null;
$quantityChange = $input['quantity_change'] ?? 0;

if (!$productId) {
    sendResponse([
        'success' => false,
        'message' => 'Product ID is required'
    ], 400);
}

try {
    $stmt = $pdo->prepare("UPDATE products SET quantity = quantity + ? WHERE id = ?");
    $stmt->execute([$quantityChange, $productId]);
    
    // Get updated quantity
    $stmt = $pdo->prepare("SELECT quantity FROM products WHERE id = ?");
    $stmt->execute([$productId]);
    $product = $stmt->fetch();
    
    sendResponse([
        'success' => true,
        'message' => 'Inventory adjusted successfully',
        'new_quantity' => $product['quantity']
    ]);
} catch(PDOException $e) {
    sendResponse([
        'success' => false,
        'message' => 'Error adjusting inventory: ' . $e->getMessage()
    ], 500);
}
?>
