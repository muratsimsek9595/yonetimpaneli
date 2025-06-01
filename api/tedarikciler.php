<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
ob_start();

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
    $sql = "SELECT id, ad FROM tedarikciler ORDER BY ad ASC";
    $result = $conn->query($sql);
    $tedarikciler = array();
    if ($result && $result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            $tedarikciler[] = $row;
        }
    }
    ob_clean();
    echo json_encode($tedarikciler);
}

function getTedarikci($conn, $id) {
    $sql = "SELECT id, ad FROM tedarikciler WHERE id = '$id'";
    $result = $conn->query($sql);
    if ($result && $result->num_rows > 0) {
        $tedarikci = $result->fetch_assoc();
        ob_clean();
        echo json_encode($tedarikci);
    } else {
        ob_clean();
        http_response_code(404);
        echo json_encode(array("message" => "Tedarikçi bulunamadı."));
    }
}

function addTedarikci($conn) {
    $data = json_decode(file_get_contents("php://input"));
    if (!empty($data->ad)) {
        $ad = $conn->real_escape_string($data->ad);
        $sql = "INSERT INTO tedarikciler (ad) VALUES ('$ad')";
        if ($conn->query($sql) === TRUE) {
            $last_id = $conn->insert_id;
            ob_clean();
            http_response_code(201); // Created
            echo json_encode(array("message" => "Tedarikçi başarıyla eklendi.", "id" => $last_id, "ad" => $ad));
        } else {
            ob_clean();
            http_response_code(500);
            echo json_encode(array("message" => "Tedarikçi eklenirken hata oluştu.", "error" => $conn->error));
        }
    } else {
        ob_clean();
        http_response_code(400); // Bad Request
        echo json_encode(array("message" => "Tedarikçi adı gönderilmedi."));
    }
}

function updateTedarikci($conn, $id) {
    $data = json_decode(file_get_contents("php://input"));
    if (!empty($data->ad)) {
        $ad = $conn->real_escape_string($data->ad);
        // Önce tedarikçinin var olup olmadığını kontrol et
        $checkSql = "SELECT id FROM tedarikciler WHERE id = '$id'";
        $checkResult = $conn->query($checkSql);
        if ($checkResult->num_rows > 0) {
            $sql = "UPDATE tedarikciler SET ad = '$ad' WHERE id = '$id'";
            if ($conn->query($sql) === TRUE) {
                ob_clean();
                echo json_encode(array("message" => "Tedarikçi başarıyla güncellendi.", "id" => $id, "ad" => $ad));
            } else {
                ob_clean();
                http_response_code(500);
                echo json_encode(array("message" => "Tedarikçi güncellenirken hata oluştu.", "error" => $conn->error));
            }
        } else {
            ob_clean();
            http_response_code(404); // Not Found
            echo json_encode(array("message" => "Güncellenecek tedarikçi bulunamadı."));
        }
    } else {
        ob_clean();
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
            ob_clean();
            echo json_encode(array("message" => "Tedarikçi başarıyla silindi."));
        } else {
            ob_clean();
            http_response_code(500);
            echo json_encode(array("message" => "Tedarikçi silinirken hata oluştu.", "error" => $conn->error));
        }
    } else {
        ob_clean();
        http_response_code(404); // Not Found
        echo json_encode(array("message" => "Silinecek tedarikçi bulunamadı."));
    }
}

$conn->close();
?> 