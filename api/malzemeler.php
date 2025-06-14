<?php
// Çıktı tamponlamasını başlat ve mevcut çıktıları temizle
ob_start();
ob_clean();

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once '../config/db_config.php'; // Veritabanı bağlantısı

$method = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? $conn->real_escape_string($_GET['id']) : null;

// CORS Başlıkları
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($method == 'OPTIONS') {
    http_response_code(200);
    ob_end_clean();
    exit();
}

switch ($method) {
    case 'GET':
        if ($id) {
            getMalzeme($conn, $id);
        } else {
            getMalzemeler($conn);
        }
        break;
    case 'POST':
        addMalzeme($conn);
        break;
    case 'PUT':
        if ($id) {
            updateMalzeme($conn, $id);
        } else {
            http_response_code(400);
            echo json_encode(array("message" => "Güncellenecek malzeme ID'si belirtilmedi."));
        }
        break;
    case 'DELETE':
        if ($id) {
            deleteMalzeme($conn, $id);
        } else {
            http_response_code(400);
            echo json_encode(array("message" => "Silinecek malzeme ID'si belirtilmedi."));
        }
        break;
    default:
        http_response_code(405);
        echo json_encode(array("message" => "Desteklenmeyen Metod."));
        break;
}

function getMalzemeler($conn) {
    $sql = "SELECT id, ad, birim_adi FROM malzemeler ORDER BY ad ASC";
    $result = $conn->query($sql);
    $malzemeler = array();
    if ($result && $result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            $malzemeler[] = $row;
        }
    }
    ob_end_clean();
    echo json_encode($malzemeler);
}

function getMalzeme($conn, $id) {
    $sql = "SELECT id, ad, birim_adi FROM malzemeler WHERE id = '$id'";
    $result = $conn->query($sql);
    if ($result && $result->num_rows > 0) {
        $malzeme = $result->fetch_assoc();
        ob_end_clean();
        echo json_encode($malzeme);
    } else {
        ob_end_clean();
        http_response_code(404);
        echo json_encode(array("message" => "Malzeme bulunamadı."));
    }
}

function addMalzeme($conn) {
    $data = json_decode(file_get_contents("php://input"));
    if (!empty($data->ad)) {
        $ad = $conn->real_escape_string($data->ad);
        $birim_adi = isset($data->birim_adi) ? $conn->real_escape_string($data->birim_adi) : '';

        $sql = "INSERT INTO malzemeler (ad, birim_adi) VALUES ('$ad', '$birim_adi')";
        if ($conn->query($sql) === TRUE) {
            $last_id = $conn->insert_id;
            ob_end_clean();
            http_response_code(201);
            echo json_encode(array("message" => "Malzeme başarıyla eklendi.", "id" => $last_id, "ad" => $ad, "birim_adi" => $birim_adi));
        } else {
            ob_end_clean();
            http_response_code(500);
            echo json_encode(array("message" => "Malzeme eklenirken SQL hatası oluştu.", "error" => $conn->error));
        }
    } else {
        ob_end_clean();
        http_response_code(400);
        echo json_encode(array("message" => "Malzeme eklemek için gerekli alan (ad) eksik."));
    }
}

function updateMalzeme($conn, $id) {
    $data = json_decode(file_get_contents("php://input"));
    if (!empty($data->ad)) {
        $ad = $conn->real_escape_string($data->ad);
        $birim_adi = isset($data->birim_adi) ? $conn->real_escape_string($data->birim_adi) : '';

        $checkSql = "SELECT id FROM malzemeler WHERE id = '$id'";
        $checkResult = $conn->query($checkSql);
        if ($checkResult->num_rows > 0) {
            $sql = "UPDATE malzemeler SET ad = '$ad', birim_adi = '$birim_adi' WHERE id = '$id'";
            if ($conn->query($sql) === TRUE) {
                ob_end_clean();
                echo json_encode(array("message" => "Malzeme başarıyla güncellendi.", "id" => $id, "ad" => $ad, "birim_adi" => $birim_adi));
            } else {
                ob_end_clean();
                http_response_code(500);
                echo json_encode(array("message" => "Malzeme güncellenirken SQL hatası oluştu.", "error" => $conn->error));
            }
        } else {
            ob_end_clean();
            http_response_code(404);
            echo json_encode(array("message" => "Güncellenecek malzeme bulunamadı."));
        }
    } else {
        ob_end_clean();
        http_response_code(400);
        echo json_encode(array("message" => "Malzeme güncellemek için gerekli alan (ad) eksik."));
    }
}

function deleteMalzeme($conn, $id) {
    $checkSql = "SELECT id FROM malzemeler WHERE id = '$id'";
    $checkResult = $conn->query($checkSql);
    if ($checkResult->num_rows > 0) {
        // ÖNEMLİ: İlişkili fiyat kayıtlarını da silmek gerekir (fiyatlar tablosundan)
        // $deleteFiyatlarSql = "DELETE FROM fiyatlar WHERE malzeme_id = '$id'";
        // if (!$conn->query($deleteFiyatlarSql)) {
        //     ob_end_clean();
        //     http_response_code(500);
        //     echo json_encode(array("message" => "Malzeme silinirken ilişkili fiyatlar silinemedi.", "error" => $conn->error));
        //     return;
        // }

        $sql = "DELETE FROM malzemeler WHERE id = '$id'";
        if ($conn->query($sql) === TRUE) {
            ob_end_clean();
            echo json_encode(array("message" => "Malzeme ve ilişkili fiyatları başarıyla silindi.")); // Mesajı güncelledim, ancak fiyat silme henüz aktif değil
        } else {
            ob_end_clean();
            http_response_code(500);
            echo json_encode(array("message" => "Malzeme silinirken SQL hatası oluştu.", "error" => $conn->error));
        }
    } else {
        ob_end_clean();
        http_response_code(404);
        echo json_encode(array("message" => "Silinecek malzeme bulunamadı."));
    }
}

$conn->close();
?>