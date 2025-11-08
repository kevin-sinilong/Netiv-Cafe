    <?php
    header('Content-Type: application/json');
    require_once 'db_connect.php'; // reuse your PDO connection

    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? '';

    if ($action === 'adjust') {
        $product_id = $input['product_id'] ?? 0;
        $change = $input['change'] ?? 0;
        $user_type = $input['user_type'] ?? 'admin';

        if (!$product_id || !is_numeric($change)) {
            echo json_encode(['success' => false, 'message' => 'Invalid product or change value']);
            exit;
        }

        // Get current stock
        $stmt = $pdo->prepare("SELECT stock_qty FROM products WHERE product_id = ?");
        $stmt->execute([$product_id]);
        $row = $stmt->fetch();
        if (!$row) {
            echo json_encode(['success' => false, 'message' => 'Product not found']);
            exit;
        }

        $before = (int)$row['stock_qty'];
        $after = $before + (int)$change;

        // Update stock
        $stmt = $pdo->prepare("UPDATE products SET stock_qty = ? WHERE product_id = ?");
        $stmt->execute([$after, $product_id]);

        // Log adjustment
        $stmt = $pdo->prepare("INSERT INTO inventory (user_type, quantity_change, quantity_before, quantity_after, product_id)
                            VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$user_type, $change, $before, $after, $product_id]);

        echo json_encode(['success' => true, 'message' => 'Inventory updated', 'before' => $before, 'after' => $after]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }

