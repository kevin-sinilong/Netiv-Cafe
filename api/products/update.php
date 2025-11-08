<?php
// API: Update product
require_once '../config/database.php';

$input = getJsonInput();
$id = $input['id'] ?? null;
$name = $input['name'] ?? '';
$price = $input['price'] ?? 0;
$quantity = $input['quantity'] ?? 0;

if (!$id) {
    sendResponse([
        'success' => false,
        'message' => 'Product ID is required'
    ], 400);
}

try {
    $stmt = $pdo->prepare("UPDATE products SET name = ?, price = ?, quantity = ? WHERE id = ?");
    $stmt->execute([$name, $price, $quantity, $id]);
    
    sendResponse([
        'success' => true,
        'message' => 'Product updated successfully'
    ]);
} catch(PDOException $e) {
    sendResponse([
        'success' => false,
        'message' => 'Error updating product: ' . $e->getMessage()
    ], 500);
}
?>
