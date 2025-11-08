<?php
// API: User Login
require_once '../config/database.php';
session_start();

$input = getJsonInput();
$username = $input['username'] ?? '';
$password = $input['password'] ?? '';

if (empty($username) || empty($password)) {
    sendResponse([
        'success' => false,
        'message' => 'Username and password are required'
    ], 400);
}

try {
    $stmt = $pdo->prepare("SELECT id, username, email, password, role FROM users WHERE username = ?");
    $stmt->execute([$username]);
    $user = $stmt->fetch();
    
    if ($user && password_verify($password, $user['password'])) {
        // Store user info in session
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['role'] = $user['role'];
        
        // Remove password from response
        unset($user['password']);
        
        sendResponse([
            'success' => true,
            'message' => 'Login successful',
            'user' => $user
        ]);
    } else {
        sendResponse([
            'success' => false,
            'message' => 'Invalid username or password'
        ], 401);
    }
} catch(PDOException $e) {
    sendResponse([
        'success' => false,
        'message' => 'Login error: ' . $e->getMessage()
    ], 500);
}
?>
