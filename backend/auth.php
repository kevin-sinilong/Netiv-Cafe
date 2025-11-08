<?php
header('Content-Type: application/json');
require_once 'db_connect.php';
session_start();

$input = json_decode(file_get_contents('php://input'), true);
$action = $input['action'] ?? '';

if ($action === 'register') {
    $name = trim($input['name'] ?? '');
    $email = trim($input['email'] ?? '');
    $password = trim($input['password'] ?? '');
    $role = trim($input['role'] ?? '');

    if (!$name || !$email || !$password || !$role) {
        echo json_encode(['success' => false, 'message' => 'All fields required']);
        exit;
    }   

    $hashed = password_hash($password, PASSWORD_DEFAULT);

    try {
        $stmt = $pdo->prepare("INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)");
        $stmt->execute([$name, $email, $hashed, $role]);
        echo json_encode(['success' => true, 'message' => 'Account created successfully. Please login.']);

    } catch (PDOException $e) {
        if ($e->getCode() == 23000) {
            echo json_encode(['success' => false, 'message' => 'Username or email already exists']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
        }
    }

} elseif ($action === 'login') {
    $name = trim($input['name'] ?? '');
    $password = trim($input['password'] ?? '');
    $role = trim($input['role'] ?? '');

    if (empty($name) || empty($password) || empty($role)) {
        echo json_encode(['success' => false, 'message' => 'All fields required']);
        exit;
    }

    try {
        $stmt = $pdo->prepare("SELECT id, username, email, password, role FROM users WHERE username = ? AND role = ?");
        $stmt->execute([$name, $role]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user) {
            if (password_verify($password, $user['password'])) {
                // Set server-side session variables
                $_SESSION['user_id'] = $user['id'];
                $_SESSION['username'] = $user['username'];
                $_SESSION['email'] = $user['email'];
                $_SESSION['role'] = $user['role'];
                
                $userData = [
                    'user_id' => $user['id'],
                    'username' => $user['username'],
                    'email' => $user['email'],
                    'role' => $user['role'],
                    'full_name' => $user['username'],
                    'name' => $user['username']
                ];
                
                echo json_encode([
                    'success' => true, 
                    'user' => $userData,
                    'message' => 'Login successful'
                ]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Invalid password']);
            }
        } else {
            echo json_encode(['success' => false, 'message' => 'User not found or invalid role']);
        }

    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }

} else {
    echo json_encode(['success' => false, 'message' => 'Invalid action']);
}
?>