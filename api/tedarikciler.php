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
            getTedarikci($conn, $id);
        } else {
            getTedarikciler($conn);
        }
        break;
    case 'POST':
        addTedarikci($conn);
        break;
    case 'PUT':
        if ($id) {
            updateTedarikci($conn, $id);
        } else {
            http_response_code(400); // Bad Request
            echo json_encode(array("message" => "Güncellenecek tedarikçi ID'si belirtilmedi."));
        }
        break;
    case 'DELETE':
        if ($id) {
            deleteTedarikci($conn, $id);
        } else {
            http_response_code(400); // Bad Request
            echo json_encode(array("message" => "Silinecek tedarikçi ID'si belirtilmedi."));
        }
        break;
    default:
        http_response_code(405); // Method Not Allowed
        echo json_encode(array("message" => "Desteklenmeyen Metod."));
        break;
}

function getTedarikciler($conn) {
    $sql = "SELECT id, ad, yetkili_kisi, telefon, email, adres, not_alani FROM tedarikciler ORDER BY ad ASC";
    $result = $conn->query($sql);
    $tedarikciler = array();
    if ($result && $result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            $tedarikciler[] = $row;
        }
    }
    ob_end_clean();
    echo json_encode($tedarikciler);
}

function getTedarikci($conn, $id) {
    $sql = "SELECT id, ad, yetkili_kisi, telefon, email, adres, not_alani FROM tedarikciler WHERE id = '$id'";
    $result = $conn->query($sql);
    if ($result && $result->num_rows > 0) {
        $tedarikci = $result->fetch_assoc();
        ob_end_clean();
        echo json_encode($tedarikci);
    } else {
        ob_end_clean();
        http_response_code(404);
        echo json_encode(array("message" => "Tedarikçi bulunamadı."));
    }
}

function addTedarikci($conn) {
    $data = json_decode(file_get_contents("php://input"));
    if (!empty($data->ad)) {
        $ad = $conn->real_escape_string($data->ad);
        $yetkili_kisi = isset($data->yetkili_kisi) ? $conn->real_escape_string($data->yetkili_kisi) : null;
        $telefon = isset($data->telefon) ? $conn->real_escape_string($data->telefon) : null;
        $email = isset($data->email) ? $conn->real_escape_string($data->email) : null;
        $adres = isset($data->adres) ? $conn->real_escape_string($data->adres) : null;
        $not_alani = isset($data->not_alani) ? $conn->real_escape_string($data->not_alani) : null;

        $stmt = $conn->prepare("INSERT INTO tedarikciler (ad, yetkili_kisi, telefon, email, adres, not_alani) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("ssssss", $ad, $yetkili_kisi, $telefon, $email, $adres, $not_alani);
        
        if ($stmt->execute()) {
            $last_id = $conn->insert_id;
            ob_end_clean();
            http_response_code(201); // Created
            echo json_encode(array(
                "message" => "Tedarikçi başarıyla eklendi.", 
                "id" => $last_id, 
                "ad" => $ad,
                "yetkili_kisi" => $yetkili_kisi,
                "telefon" => $telefon,
                "email" => $email,
                "adres" => $adres,
                "not_alani" => $not_alani
            ));
        } else {
            ob_end_clean();
            http_response_code(500);
            echo json_encode(array("message" => "Tedarikçi eklenirken hata oluştu.", "error" => $stmt->error));
        }
        $stmt->close();
    } else {
        ob_end_clean();
        http_response_code(400); // Bad Request
        echo json_encode(array("message" => "Tedarikçi adı gönderilmedi."));
    }
}

function updateTedarikci($conn, $id) {
    $data = json_decode(file_get_contents("php://input"));
    if (!empty($data->ad)) {
        $ad = $conn->real_escape_string($data->ad);
        $yetkili_kisi = isset($data->yetkili_kisi) ? $conn->real_escape_string($data->yetkili_kisi) : null;
        $telefon = isset($data->telefon) ? $conn->real_escape_string($data->telefon) : null;
        $email = isset($data->email) ? $conn->real_escape_string($data->email) : null;
        $adres = isset($data->adres) ? $conn->real_escape_string($data->adres) : null;
        $not_alani = isset($data->not_alani) ? $conn->real_escape_string($data->not_alani) : null;

        $checkSql = "SELECT id FROM tedarikciler WHERE id = ?";
        $checkStmt = $conn->prepare($checkSql);
        $checkStmt->bind_param("s", $id);
        $checkStmt->execute();
        $checkResult = $checkStmt->get_result();

        if ($checkResult->num_rows > 0) {
            $stmt = $conn->prepare("UPDATE tedarikciler SET ad = ?, yetkili_kisi = ?, telefon = ?, email = ?, adres = ?, not_alani = ? WHERE id = ?");
            $stmt->bind_param("ssssssi", $ad, $yetkili_kisi, $telefon, $email, $adres, $not_alani, $id);
            
            if ($stmt->execute()) {
                ob_end_clean();
                echo json_encode(array(
                    "message" => "Tedarikçi başarıyla güncellendi.", 
                    "id" => $id, 
                    "ad" => $ad,
                    "yetkili_kisi" => $yetkili_kisi,
                    "telefon" => $telefon,
                    "email" => $email,
                    "adres" => $adres,
                    "not_alani" => $not_alani
                ));
            } else {
                ob_end_clean();
                http_response_code(500);
                echo json_encode(array("message" => "Tedarikçi güncellenirken hata oluştu.", "error" => $stmt->error));
            }
            $stmt->close();
        } else {
            ob_end_clean();
            http_response_code(404); // Not Found
            echo json_encode(array("message" => "Güncellenecek tedarikçi bulunamadı."));
        }
    } else {
        ob_end_clean();
        http_response_code(400);
        echo json_encode(array("message" => "Güncellenecek tedarikçi adı gönderilmedi."));
    }
}

function deleteTedarikci($conn, $id) {
    // Önce tedarikçinin var olup olmadığını kontrol et
    $checkSql = "SELECT id FROM tedarikciler WHERE id = '$id'";
    $checkResult = $conn->query($checkSql);
    if ($checkResult->num_rows > 0) {
        // İPUCU: İlişkili fiyat kayıtlarını da silmek gerekebilir (fiyatlar tablosundan)
        // $deleteFiyatlarSql = "DELETE FROM fiyatlar WHERE tedarikci_id = '$id'";
        // $conn->query($deleteFiyatlarSql);

        $sql = "DELETE FROM tedarikciler WHERE id = '$id'";
        if ($conn->query($sql) === TRUE) {
            ob_end_clean();
            echo json_encode(array("message" => "Tedarikçi başarıyla silindi."));
        } else {
            ob_end_clean();
            http_response_code(500);
            echo json_encode(array("message" => "Tedarikçi silinirken hata oluştu.", "error" => $conn->error));
        }
    } else {
        ob_end_clean();
        http_response_code(404); // Not Found
        echo json_encode(array("message" => "Silinecek tedarikçi bulunamadı."));
    }
}

$conn->close(); 