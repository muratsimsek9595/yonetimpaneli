<?php
// TÜM BAŞLIKLARI EN BAŞA AL
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// OPTIONS isteği başlıklar ayarlandıktan sonra ele alınabilir
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// --- GEÇİCİ TEST BAŞLANGICI ---
echo json_encode(["status" => "musteriler_api_test", "message" => "Veritabanı bağlantısı olmadan test ediliyor"]);
exit();
// --- GEÇİCİ TEST SONU ---

/* // GEÇİCİ OLARAK DEVRE DIŞI BIRAKILDI
// Veritabanı bağlantısı
require_once '../config/db_config.php'; 

// $conn bağlantısının varlığını kontrol et (db_config.php sonrası hemen yapılmalı)
if (!$conn || $conn->connect_error) { 
    http_response_code(503); 
    echo json_encode(array("message" => "Veritabanı bağlantısı kurulamadı.", "error_detail" => ($conn ? $conn->connect_error : "Bağlantı nesnesi oluşturulamadı.")));
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];
$id_param = null;
if (isset($_GET['id'])) {
    $id_param = trim($_GET['id']); 
}

switch ($method) {
    case 'GET':
        if ($id_param !== null) {
            // getMusteri($conn, $id_param); // Devre dışı
             echo json_encode(["message" => "getMusteri devre dışı"]); exit();
        } else {
            // getMusteriler($conn); // Devre dışı
            echo json_encode(["message" => "getMusteriler devre dışı"]); exit();
        }
        break;
    case 'POST':
        // addMusteri($conn); // Devre dışı
        echo json_encode(["message" => "addMusteri devre dışı"]); exit();
        break;
    case 'PUT':
        // updateMusteri($conn, $id_param); // Devre dışı
        echo json_encode(["message" => "updateMusteri devre dışı"]); exit();
        break;
    case 'DELETE':
        // deleteMusteri($conn, $id_param); // Devre dışı
        echo json_encode(["message" => "deleteMusteri devre dışı"]); exit();
        break;
    default:
        http_response_code(405); 
        echo json_encode(array("message" => "Desteklenmeyen Metod: " . $method));
        break;
}

// Fonksiyon tanımları da geçici olarak burada kalabilir veya silinebilir, nasılsa çağrılmıyorlar.
// ... (getMusteriler, getMusteri, addMusteri, updateMusteri, deleteMusteri fonksiyonları) ...

if (isset($conn)) {
    $conn->close();
}
*/ // GEÇİCİ OLARAK DEVRE DIŞI BIRAKILDI SONU
?> 