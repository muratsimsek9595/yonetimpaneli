<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
ob_start();

require_once '../config/db_config.php'; // Veritabanı bağlantısı

$method = $_SERVER['REQUEST_METHOD'];

header("Access-Control-Allow-Origin: *"); // CORS için (geliştirme aşamasında *)
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// OPTIONS isteği için ön kontrol (preflight)
if ($method == 'OPTIONS') {
    http_response_code(200);
    exit();
}

switch ($method) {
    case 'GET':
        // ID parametresi varsa tek bir malzeme getir, yoksa tümünü getir
        if (isset($_GET['id'])) {
            getMalzeme($conn, $_GET['id']);
        } else {
            getMalzemeler($conn);
        }
        break;
    // POST, PUT, DELETE case'leri daha sonra eklenecek
    default:
        http_response_code(405); // Method Not Allowed
        echo json_encode(array("message" => "Desteklenmeyen Metod."));
        break;
}

function getMalzemeler($conn) {
    $sql = "SELECT id, ad, birim_tipi, birim_adi FROM malzemeler ORDER BY ad ASC";
    $result = $conn->query($sql);
    $malzemeler = array();

    if ($result) {
        if ($result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $malzemeler[] = $row;
            }
        }
        ob_clean(); // Çıktı tamponunu temizle, sadece JSON dönsün
        echo json_encode($malzemeler);
    } else {
        ob_clean();
        http_response_code(500);
        echo json_encode(
            array("message" => "Malzemeler getirilirken bir SQL hatası oluştu.", "error" => $conn->error)
        );
    }
}

function getMalzeme($conn, $id) {
    $id = $conn->real_escape_string($id); // SQL injection önlemi
    $sql = "SELECT id, ad, birim_tipi, birim_adi FROM malzemeler WHERE id = '$id'";
    $result = $conn->query($sql);

    if ($result) {
        if ($result->num_rows > 0) {
            $malzeme = $result->fetch_assoc();
            ob_clean();
            echo json_encode($malzeme);
        } else {
            ob_clean();
            http_response_code(404); // Not Found
            echo json_encode(array("message" => "Malzeme bulunamadı."));
        }
    } else {
        ob_clean();
        http_response_code(500);
        echo json_encode(
            array("message" => "Malzeme getirilirken bir SQL hatası oluştu.", "error" => $conn->error)
        );
    }
}

$conn->close();
?> 