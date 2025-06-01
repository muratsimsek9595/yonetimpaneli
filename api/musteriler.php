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

// --- db_config.php ve bağlantı kontrolünü geri etkinleştir ---
require_once '../config/db_config.php'; 

if (!$conn || $conn->connect_error) { 
    http_response_code(503); 
    echo json_encode(array(
        "status" => "db_connection_error", 
        "message" => "Veritabanı bağlantısı kurulamadı.", 
        "error_detail" => ($conn ? $conn->connect_error : "Bağlantı nesnesi (\$conn) oluşturulamadı veya null.")
    ));
    exit();
}
// --- db_config.php ve bağlantı kontrolü sonu ---

// --- İstek metodu ve ID parametresini almayı etkinleştir ---
$method = $_SERVER['REQUEST_METHOD'];
$id_param = null;
if (isset($_GET['id'])) {
    $id_param = trim($_GET['id']); 
}
// --- İstek metodu ve ID parametresi alma sonu ---

// --- ÖNCEKİ TEST ÇIKTISI VE EXIT KALDIRILDI ---

// --- switch bloğunu etkinleştir, içindeki asıl çağrılar yorumlu kalsın ---
switch ($method) {
    case 'GET':
        if ($id_param !== null) {
            // getMusteri($conn, $id_param); // Devre dışı
            echo json_encode(["status" => "switch_case_get_with_id", "id_param" => $id_param]); 
            exit();
        } else {
            // getMusteriler($conn); // Devre dışı
            echo json_encode(["status" => "switch_case_get_all"]); 
            exit();
        }
        break;
    case 'POST':
        // addMusteri($conn); // Devre dışı
        echo json_encode(["status" => "switch_case_post"]); 
        exit();
        break;
    case 'PUT':
        // updateMusteri($conn, $id_param); // Devre dışı
        echo json_encode(["status" => "switch_case_put", "id_param" => $id_param]); 
        exit();
        break;
    case 'DELETE':
        // deleteMusteri($conn, $id_param); // Devre dışı
        echo json_encode(["status" => "switch_case_delete", "id_param" => $id_param]); 
        exit();
        break;
    default:
        http_response_code(405); 
        echo json_encode(["status" => "switch_case_default", "message" => "Desteklenmeyen Metod: " . $method]);
        exit();
        break;
}
// --- switch bloğu sonu ---

/* // FONKSİYON TANIMLARI VE BAĞLANTI KAPATMA HALA DEVRE DIŞI
// Fonksiyon tanımları da geçici olarak burada kalabilir veya silinebilir, nasılsa çağrılmıyorlar.
// ... (getMusteriler, getMusteri, addMusteri, updateMusteri, deleteMusteri fonksiyonları) ...

if (isset($conn)) {
    $conn->close();
}
*/ // GEÇİCİ OLARAK DEVRE DIŞI BIRAKILDI SONU
?> 