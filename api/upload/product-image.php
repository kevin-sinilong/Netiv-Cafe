<?php
// API: Upload product image
require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse([
        'success' => false,
        'message' => 'Invalid request method'
    ], 405);
}

$productId = $_POST['product_id'] ?? null;

if (!$productId) {
    sendResponse([
        'success' => false,
        'message' => 'Product ID is required'
    ], 400);
}

if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
    sendResponse([
        'success' => false,
        'message' => 'No image uploaded or upload error'
    ], 400);
}

$file = $_FILES['image'];
$allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
$maxSize = 5 * 1024 * 1024; // 5MB

// Validate file type
if (!in_array($file['type'], $allowedTypes)) {
    sendResponse([
        'success' => false,
        'message' => 'Invalid file type. Only JPG, PNG, GIF, and WEBP are allowed'
    ], 400);
}

// Validate file size
if ($file['size'] > $maxSize) {
    sendResponse([
        'success' => false,
        'message' => 'File too large. Maximum size is 5MB'
    ], 400);
}

// Create upload directory if it doesn't exist
$uploadDir = __DIR__ . '/../../public/uploads/products/';
if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

// Generate unique filename
$extension = pathinfo($file['name'], PATHINFO_EXTENSION);
$filename = 'product_' . $productId . '_' . time() . '.' . $extension;
$filepath = $uploadDir . $filename;

try {
    // Delete old image if exists
    $stmt = $pdo->prepare("SELECT image FROM products WHERE id = ?");
    $stmt->execute([$productId]);
    $product = $stmt->fetch();
    
    if ($product && $product['image']) {
        $oldImagePath = $uploadDir . $product['image'];
        if (file_exists($oldImagePath)) {
            unlink($oldImagePath);
        }
    }
    
    // Move uploaded file
    if (!move_uploaded_file($file['tmp_name'], $filepath)) {
        throw new Exception('Failed to move uploaded file');
    }
    
    // Update database
    $stmt = $pdo->prepare("UPDATE products SET image = ? WHERE id = ?");
    $stmt->execute([$filename, $productId]);
    
    sendResponse([
        'success' => true,
        'message' => 'Image uploaded successfully',
        'filename' => $filename,
        'url' => 'uploads/products/' . $filename
    ]);
    
} catch (Exception $e) {
    sendResponse([
        'success' => false,
        'message' => $e->getMessage()
    ], 500);
}
?>
