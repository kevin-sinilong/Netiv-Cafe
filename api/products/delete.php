<?php
// API: Delete product
require_once '../config/database.php';

$input = getJsonInput();
$id = $input['id'] ?? null;

if (!$id) {
    sendResponse([
        'success' => false,
        'message' => 'Product ID is required'
    ], 400);
}

try {
    $stmt = $pdo->prepare("DELETE FROM products WHERE id = ?");
    $stmt->execute([$id]);
    
    sendResponse([
        'success' => true,
        'message' => 'Product deleted successfully'
    ]);
} catch(PDOException $e) {
    sendResponse([
        'success' => false,
        'message' => 'Error deleting product: ' . $e->getMessage()
    ], 500);
}
?>
