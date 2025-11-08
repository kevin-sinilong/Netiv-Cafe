<?php
// backend/orders.php
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
session_start();

$input = json_decode(file_get_contents('php://input'), true);
$action = $input['action'] ?? '';

try {
    switch($action) {
        case 'create_order':
            createOrder($pdo, $input);
            break;
        case 'list_cashier_orders':
            listCashierOrders($pdo, $input);
            break;
        case 'list_all_orders':
            listAllOrders($pdo);
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
} catch(Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

function createOrder($pdo, $data) {
    $pdo->beginTransaction();
    
    try {
        // Get cashier ID from session or input
        $cashierId = $_SESSION['user_id'] ?? $data['cashier_id'] ?? null;
        
        if (!$cashierId) {
            throw new Exception('Cashier ID is required');
        }
        
        $items = $data['items'] ?? [];
        $total = $data['total'] ?? 0;
        $cashPaid = $data['cash_received'] ?? 0;
        $change = $data['change'] ?? 0;
        
        if (empty($items)) {
            throw new Exception('No items in order');
        }
        
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
        
        echo json_encode([
            'success' => true, 
            'message' => 'Order created successfully',
            'order_id' => $orderId
        ]);
        
    } catch(Exception $e) {
        $pdo->rollBack();
        echo json_encode([
            'success' => false, 
            'message' => 'Order failed: ' . $e->getMessage()
        ]);
    }
}

function listCashierOrders($pdo, $data) {
    try {
        $cashierId = $_SESSION['user_id'] ?? $data['cashier_id'] ?? null;
        
        if (!$cashierId) {
            throw new Exception('Cashier ID is required');
        }
        
        $stmt = $pdo->prepare("
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
            WHERE o.cashier_id = ?
            ORDER BY o.created_at DESC
            LIMIT 50
        ");
        $stmt->execute([$cashierId]);
        $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
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
            $order['items'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }
        
        echo json_encode([
            'success' => true,
            'orders' => $orders
        ]);
        
    } catch(Exception $e) {
        echo json_encode([
            'success' => false,
            'message' => $e->getMessage()
        ]);
    }
}

function listAllOrders($pdo) {
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
        $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
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
            $order['items'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }
        
        echo json_encode([
            'success' => true,
            'orders' => $orders
        ]);
        
    } catch(Exception $e) {
        echo json_encode([
            'success' => false,
            'message' => $e->getMessage()
        ]);
    }
}
?>  