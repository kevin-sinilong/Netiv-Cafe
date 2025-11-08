<?php
// API: Create new product
require_once '../config/database.php';

$input = getJsonInput();
$name = $input['name'] ?? '';
$price = $input['price'] ?? 0;
$quantity = $input['quantity'] ?? 0;

if (empty($name)) {
    sendResponse([
        'success' => false,
        'message' => 'Product name is required'
    ], 400);
}

try {
    $stmt = $pdo->prepare("INSERT INTO products (name, price, quantity) VALUES (?, ?, ?)");
    $stmt->execute([$name, $price, $quantity]);
    
    sendResponse([
        'success' => true,
        'message' => 'Product created successfully',
        'product_id' => $pdo->lastInsertId()
    ]);
} catch(PDOException $e) {
    sendResponse([
        'success' => false,
        'message' => 'Error creating product: ' . $e->getMessage()
    ], 500);
}
?>
