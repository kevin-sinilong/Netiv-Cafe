<?php
$host = 'localhost';
$dbname = 'netivcafe';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    // ✅ No echo or print statements here!
} catch (PDOException $e) {
    // Only return JSON if you want to handle it in frontend
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    exit;
}
