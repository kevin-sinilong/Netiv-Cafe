<?php
// API: List all products
require_once '../config/database.php';

try {
    $stmt = $pdo->query("SELECT id, name, image, price, quantity FROM products ORDER BY name");
    $products = $stmt->fetchAll();
    
    sendResponse([
        'success' => true,
        'products' => $products
    ]);
} catch(PDOException $e) {
    sendResponse([
        'success' => false,
        'message' => 'Error fetching products: ' . $e->getMessage()
    ], 500);
}
?>
