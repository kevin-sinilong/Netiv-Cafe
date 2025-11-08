<?php
header('Content-Type: application/json');
require_once 'db_connect.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

try {
    $productId = $_POST['product_id'] ?? null;
    
    if (!$productId) {
        throw new Exception('Product ID is required');
    }
    
    if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
        throw new Exception('No image uploaded or upload error');
    }
    
    $file = $_FILES['image'];
    $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    $maxSize = 5 * 1024 * 1024; // 5MB
    
    // Validate file type
    if (!in_array($file['type'], $allowedTypes)) {
        throw new Exception('Invalid file type. Only JPG, PNG, GIF, and WEBP are allowed');
    }
    
    // Validate file size
    if ($file['size'] > $maxSize) {
        throw new Exception('File too large. Maximum size is 5MB');
    }
    
    // Create upload directory if it doesn't exist
    $uploadDir = __DIR__ . '/../uploads/products/';
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }
    
    // Generate unique filename
    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = 'product_' . $productId . '_' . time() . '.' . $extension;
    $filepath = $uploadDir . $filename;
    
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
    
    echo json_encode([
        'success' => true,
        'message' => 'Image uploaded successfully',
        'filename' => $filename,
        'url' => 'uploads/products/' . $filename
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
