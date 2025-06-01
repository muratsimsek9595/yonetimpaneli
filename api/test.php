<?php
// Çıktı tamponlamasını başlat ve mevcut çıktıları temizle
ob_start();
ob_clean();

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    ob_end_clean();
    exit();
}

try {
    require_once '../config/db_config.php';
    
    // Basit bir test sorgusu
    $sql = "SELECT 1 as test_value";
    $result = $conn->query($sql);
    
    if ($result) {
        $test_data = $result->fetch_assoc();
        ob_end_clean();
        echo json_encode([
            'status' => 'success',
            'message' => 'Veritabanı bağlantısı başarılı',
            'test_value' => $test_data['test_value'],
            'timestamp' => date('Y-m-d H:i:s')
        ]);
    } else {
        ob_end_clean();
        http_response_code(500);
        echo json_encode([
            'status' => 'error',
            'message' => 'Test sorgusu çalıştırılamadı',
            'error' => $conn->error
        ]);
    }
    
    $conn->close();
} catch (Exception $e) {
    ob_end_clean();
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'API hatası',
        'error' => $e->getMessage()
    ]);
}
?> 