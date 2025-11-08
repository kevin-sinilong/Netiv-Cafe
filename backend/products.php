<?php
// backend/products.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once 'db_connect.php';

try {
    // Get JSON input
    $jsonInput = file_get_contents('php://input');
    $input = json_decode($jsonInput, true);
    
    // Log for debugging
    error_log("Products PHP - Action: " . ($input['action'] ?? 'none'));
    error_log("Products PHP - Input: " . json_encode($input));
    
    $action = $input['action'] ?? '';
    
    switch($action) {
        case 'list':
            listProducts($pdo);
            break;
        case 'add_product':
            addProduct($pdo, $input);
            break;
        case 'edit_product':  // ✅ ADD THIS
            updateProduct($pdo, $input);
            break;
        case 'delete_product':  // ✅ ADD THIS
            deleteProduct($pdo, $input);
            break;
        case 'adjust_inventory':
            adjustInventory($pdo, $input);
            break;
        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid action: ' . $action]);
    }
} catch(Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}

function listProducts($pdo) {
    try {
        $query = "SELECT id, name, image, price, quantity FROM products ORDER BY name";
        $stmt = $pdo->query($query);
        $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'products' => $products
        ]);
        
    } catch(Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false, 
            'message' => 'Database error: ' . $e->getMessage()
        ]);
    }
}

function addProduct($pdo, $data) {
    try {
        $productName = $data['product_name'] ?? '';
        $price = $data['price'] ?? 0;
        $quantity = $data['quantity'] ?? 0;
        
        if (!$productName) {
            throw new Exception('Product name is required');
        }
        
        $query = "INSERT INTO products (name, price, quantity) VALUES (:name, :price, :quantity)";
        $stmt = $pdo->prepare($query);
        $stmt->execute([
            ':name' => $productName,
            ':price' => $price,
            ':quantity' => $quantity
        ]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Product added successfully'
        ]);
        
    } catch(Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false, 
            'message' => 'Add product error: ' . $e->getMessage()
        ]);
    }
}

// ✅ ADD THIS FUNCTION
function updateProduct($pdo, $data) {
    try {
        $productId = $data['product_id'] ?? 0;
        $productName = $data['product_name'] ?? '';
        $price = $data['price'] ?? 0;
        $quantity = $data['quantity'] ?? 0;
        
        if (!$productId || !$productName) {
            throw new Exception('Product ID and name are required');
        }
        
        $query = "UPDATE products SET name = :name, price = :price, quantity = :quantity WHERE id = :id";
        $stmt = $pdo->prepare($query);
        $stmt->execute([
            ':name' => $productName,
            ':price' => $price,
            ':quantity' => $quantity,
            ':id' => $productId
        ]);
        
        if ($stmt->rowCount() > 0) {
            echo json_encode([
                'success' => true,
                'message' => 'Product updated successfully'
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Product not found or no changes made'
            ]);
        }
        
    } catch(Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false, 
            'message' => 'Update error: ' . $e->getMessage()
        ]);
    }
}

// ✅ ADD THIS FUNCTION
function deleteProduct($pdo, $data) {
    try {
        $productId = $data['product_id'] ?? 0;
        
        if (!$productId) {
            throw new Exception('Product ID is required');
        }
        
        $query = "DELETE FROM products WHERE id = :id";
        $stmt = $pdo->prepare($query);
        $stmt->execute([':id' => $productId]);
        
        if ($stmt->rowCount() > 0) {
            echo json_encode([
                'success' => true,
                'message' => 'Product deleted successfully'
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Product not found'
            ]);
        }
        
    } catch(Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false, 
            'message' => 'Delete error: ' . $e->getMessage()
        ]);
    }
}

function adjustInventory($pdo, $data) {
    try {
        $productId = $data['product_id'] ?? 0;
        $quantityChange = $data['quantity_change'] ?? 0;
        
        if (!$productId) {
            throw new Exception('Product ID is required');
        }
        
        $query = "UPDATE products SET quantity = quantity + :change WHERE id = :id";
        $stmt = $pdo->prepare($query);
        $stmt->execute([
            ':change' => $quantityChange,
            ':id' => $productId
        ]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Inventory adjusted successfully'
        ]);
        
    } catch(Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false, 
            'message' => 'Inventory adjustment error: ' . $e->getMessage()
        ]);
    }
}
?>