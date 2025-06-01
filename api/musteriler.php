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
            echo json_encode(["status" => "switch_case_get_with_id_test_active", "id_param" => $id_param]); 
            exit();
        } else {
            getMusteriler($conn); 
        }
        break;
    case 'POST':
        addMusteri($conn); // <<-- BU ÇAĞRI ŞİMDİ AKTİF
        // echo json_encode(["status" => "switch_case_post_test_active"]); // Test echo kaldırıldı
        // exit(); // Test exit kaldırıldı
        break;
    case 'PUT':
        // updateMusteri($conn, $id_param); // Devre dışı
        echo json_encode(["status" => "switch_case_put_test_active", "id_param" => $id_param]); 
        exit();
        break;
    case 'DELETE':
        // deleteMusteri($conn, $id_param); // Devre dışı
        echo json_encode(["status" => "switch_case_delete_test_active", "id_param" => $id_param]); 
        exit();
        break;
    default:
        http_response_code(405); 
        echo json_encode(["status" => "switch_case_default", "message" => "Desteklenmeyen Metod: " . $method]);
        exit();
        break;
}
// --- switch bloğu sonu ---

// --- FONKSİYON TANIMLARI VE BAĞLANTI KAPATMA ETKİNLEŞTİRİLDİ ---
function getMusteriler($conn) {
    $sql = "SELECT id, ad, yetkiliKisi, telefon, email, adres, vergiNo, notlar, created_at, updated_at FROM musteriler ORDER BY ad";
    $result = $conn->query($sql);
    $musteriler = array();
    if ($result) {
        while($row = $result->fetch_assoc()) {
            $musteriler[] = $row;
        }
        echo json_encode(array("status" => "success", "data" => $musteriler));
    } else {
        http_response_code(500);
        echo json_encode(array("status" => "error", "message" => "Müşteriler getirilirken sunucu hatası oluştu: " . $conn->error));
    }
}

function getMusteri($conn, $id) {
    $stmt = $conn->prepare("SELECT id, ad, yetkiliKisi, telefon, email, adres, vergiNo, notlar, created_at, updated_at FROM musteriler WHERE id = ?");
    if (!$stmt) {
        http_response_code(500);
        echo json_encode(array("status" => "error", "message" => "Sorgu hazırlanırken hata: " . $conn->error));
        exit();
    }
    $stmt->bind_param("i", $id);
    if ($stmt->execute()) {
        $result = $stmt->get_result();
        if ($result->num_rows > 0) {
            $musteri = $result->fetch_assoc();
            echo json_encode(array("status" => "success", "data" => $musteri));
        } else {
            http_response_code(404);
            echo json_encode(array("status" => "error", "message" => "Müşteri bulunamadı."));
        }
    } else {
        http_response_code(500);
        echo json_encode(array("status" => "error", "message" => "Müşteri getirilirken hata: " . $stmt->error));
    }
    $stmt->close();
    exit();
}

function addMusteri($conn) {
    // --- GEÇİCİ TEŞHİS KODU BAŞLANGICI ---
    header("Content-Type: text/plain; charset=UTF-8"); // Yanıtın JSON olmadığını belirt
    $raw_input = file_get_contents("php://input");
    echo "Ham input:\n";
    var_dump($raw_input);
    echo "\n\nInput string uzunluğu: " . strlen($raw_input) . "\n";
    
    $data = json_decode($raw_input);
    
    echo "\n\njson_decode sonrası \$data:\n";
    var_dump($data);
    
    echo "\n\njson_last_error(): " . json_last_error() . "\n";
    echo "json_last_error_msg(): " . json_last_error_msg() . "\n";
    // --- GEÇİCİ TEŞHİS KODU SONU ---
    
    // Asıl mantık geçici olarak devre dışı bırakıldı, sadece test için exit();
    exit();

    /* // ASIL KOD GEÇİCİ OLARAK DEVRE DIŞI
    if (empty($data->ad)) {
        http_response_code(400); 
        echo json_encode(array("status" => "error", "message" => "Müşteri adı boş olamaz."));
        exit();
    }

    $ad = $conn->real_escape_string($data->ad);
    $yetkiliKisi = isset($data->yetkiliKisi) ? $conn->real_escape_string($data->yetkiliKisi) : null;
    $telefon = isset($data->telefon) ? $conn->real_escape_string($data->telefon) : null;
    $email = isset($data->email) ? $conn->real_escape_string($data->email) : null;
    $adres = isset($data->adres) ? $conn->real_escape_string($data->adres) : null;
    $vergiNo = isset($data->vergiNo) ? $conn->real_escape_string($data->vergiNo) : null;
    $notlar = isset($data->notlar) ? $conn->real_escape_string($data->notlar) : null;
    $created_at = date('Y-m-d H:i:s');
    $updated_at = date('Y-m-d H:i:s');

    $stmt = $conn->prepare("INSERT INTO musteriler (ad, yetkiliKisi, telefon, email, adres, vergiNo, notlar, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    if (!$stmt) {
        http_response_code(500);
        echo json_encode(array("status" => "error", "message" => "Sorgu hazırlanırken hata: " . $conn->error));
        exit(); 
    }

    $stmt->bind_param("sssssssss", $ad, $yetkiliKisi, $telefon, $email, $adres, $vergiNo, $notlar, $created_at, $updated_at);

    if ($stmt->execute()) {
        $yeniMusteriId = $conn->insert_id; 
        http_response_code(201);
        echo json_encode(array("status" => "success", "message" => "Müşteri başarıyla eklendi.", "id" => $yeniMusteriId));
    } else {
        http_response_code(500);
        echo json_encode(array("status" => "error", "message" => "Müşteri eklenirken hata: " . $stmt->error . " (Query: INSERT ...)"));
    }
    $stmt->close();
    exit();
    */ // ASIL KOD GEÇİCİ OLARAK DEVRE DIŞI SONU
}

function updateMusteri($conn, $id) {
    if (empty($id)) {
        http_response_code(400);
        echo json_encode(array("status" => "error", "message" => "Güncellenecek müşteri ID'si belirtilmedi."));
        exit();
    }

    $data = json_decode(file_get_contents("php://input"));

    if (!isset($data->ad) || empty(trim($data->ad))) {
        http_response_code(400);
        echo json_encode(array("status" => "error", "message" => "Müşteri adı boş olamaz."));
        exit();
    }

    $ad = $conn->real_escape_string(trim($data->ad));
    $yetkiliKisi = isset($data->yetkiliKisi) ? $conn->real_escape_string($data->yetkiliKisi) : null;
    $telefon = isset($data->telefon) ? $conn->real_escape_string($data->telefon) : null;
    $email = isset($data->email) ? $conn->real_escape_string($data->email) : null;
    $adres = isset($data->adres) ? $conn->real_escape_string($data->adres) : null;
    $vergiNo = isset($data->vergiNo) ? $conn->real_escape_string($data->vergiNo) : null;
    $notlar = isset($data->notlar) ? $conn->real_escape_string($data->notlar) : null;
    $updated_at = date('Y-m-d H:i:s');

    $stmt = $conn->prepare("UPDATE musteriler SET ad = ?, yetkiliKisi = ?, telefon = ?, email = ?, adres = ?, vergiNo = ?, notlar = ?, updated_at = ? WHERE id = ?");
    if (!$stmt) {
        http_response_code(500);
        echo json_encode(array("status" => "error", "message" => "Sorgu hazırlanırken hata: " . $conn->error));
        exit();
    }
    $stmt->bind_param("ssssssssi", $ad, $yetkiliKisi, $telefon, $email, $adres, $vergiNo, $notlar, $updated_at, $id);

    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            echo json_encode(array("status" => "success", "message" => "Müşteri başarıyla güncellendi."));
        } else {
            echo json_encode(array("status" => "info", "message" => "Müşteri bilgileri güncel ya da belirtilen ID bulunamadı."));
        }
    } else {
        http_response_code(500);
        echo json_encode(array("status" => "error", "message" => "Müşteri güncellenirken hata: " . $stmt->error));
    }
    $stmt->close();
    exit();
}

function deleteMusteri($conn, $id) {
    if (empty($id)) {
        http_response_code(400);
        echo json_encode(array("status" => "error", "message" => "Silinecek müşteri ID'si belirtilmedi."));
        exit();
    }

    $stmt = $conn->prepare("DELETE FROM musteriler WHERE id = ?");
    if (!$stmt) {
        http_response_code(500);
        echo json_encode(array("status" => "error", "message" => "Sorgu hazırlanırken hata: " . $conn->error));
        exit();
    }
    $stmt->bind_param("i", $id);

    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            echo json_encode(array("status" => "success", "message" => "Müşteri başarıyla silindi."));
        } else {
            http_response_code(404); 
            echo json_encode(array("status" => "error", "message" => "Silinecek müşteri bulunamadı veya zaten silinmiş."));
        }
    } else {
        http_response_code(500);
        if ($conn->errno == 1451) { 
             echo json_encode(array("status" => "error", "message" => "Bu müşteri silinemez çünkü ilişkili teklifleri bulunmaktadır.", "detail" => $stmt->error));
        } else {
             echo json_encode(array("status" => "error", "message" => "Müşteri silinirken hata: " . $stmt->error));
        }
    }
    $stmt->close();
    exit();
}

if (isset($conn) && $conn instanceof mysqli && $conn->thread_id) {
    $conn->close();
}
?> 