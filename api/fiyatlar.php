<?php
ob_start();
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once '../config/db_config.php'; // Veritabanı bağlantısı

$method = $_SERVER['REQUEST_METHOD'];

// CORS Başlıkları
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS"); // Şimdilik PUT yok
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($method == 'OPTIONS') {
    http_response_code(200);
    exit();
}

switch ($method) {
    case 'GET':
        getFiyatlar($conn, $_GET); // Filtreleri $_GET ile alacağız
        break;
    case 'POST':
        addFiyat($conn);
        break;
    case 'DELETE':
        if (isset($_GET['id'])) {
            $id = $conn->real_escape_string($_GET['id']);
            deleteFiyat($conn, $id);
        } elseif (isset($_GET['malzeme_id']) || isset($_GET['tedarikci_id'])) {
            handleBulkDelete($conn, $_GET);
        } else {
            ob_clean();
            http_response_code(400);
            echo json_encode(array("message" => "Silme için id, malzeme_id veya tedarikci_id belirtilmedi."));
        }
        break;
    default:
        http_response_code(405); // Method Not Allowed
        echo json_encode(array("message" => "Desteklenmeyen Metod."));
        break;
}

function addFiyat($conn) {
    $data = json_decode(file_get_contents("php://input"));

    if (!empty($data->malzeme_id) && !empty($data->tedarikci_id) && isset($data->fiyat) && !empty($data->tarih)) {
        $malzeme_id = $conn->real_escape_string($data->malzeme_id);
        $tedarikci_id = $conn->real_escape_string($data->tedarikci_id);
        $fiyat = $conn->real_escape_string($data->fiyat);
        $tarih = $conn->real_escape_string($data->tarih);

        // Tarih formatını kontrol et (YYYY-AA-GG)
        if (!preg_match("/^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])$/", $tarih)) {
            ob_clean();
            http_response_code(400);
            echo json_encode(array("message" => "Geçersiz tarih formatı. YYYY-AA-GG kullanılmalı."));
            return;
        }
        // Fiyatın sayısal olup olmadığını kontrol et
        if (!is_numeric($fiyat)) {
            ob_clean();
            http_response_code(400);
            echo json_encode(array("message" => "Fiyat sayısal bir değer olmalı."));
            return;
        }

        $sql = "INSERT INTO fiyatlar (malzeme_id, tedarikci_id, fiyat, tarih) VALUES ('$malzeme_id', '$tedarikci_id', '$fiyat', '$tarih')";
        
        if ($conn->query($sql) === TRUE) {
            $last_id = $conn->insert_id;
            ob_clean();
            http_response_code(201); // Created
            echo json_encode(array(
                "message" => "Fiyat başarıyla eklendi.", 
                "id" => $last_id,
                "malzeme_id" => $malzeme_id,
                "tedarikci_id" => $tedarikci_id,
                "fiyat" => $fiyat,
                "tarih" => $tarih
            ));
        } else {
            ob_clean();
            http_response_code(500);
            echo json_encode(array("message" => "Fiyat eklenirken SQL hatası oluştu.", "error" => $conn->error));
        }
    } else {
        ob_clean();
        http_response_code(400); // Bad Request
        echo json_encode(array("message" => "Fiyat eklemek için gerekli alanlar (malzeme_id, tedarikci_id, fiyat, tarih) eksik."));
    }
}

function getFiyatlar($conn, $params) {
    $sql = "SELECT f.id, f.malzeme_id, m.ad as malzeme_adi, m.birim_adi as malzeme_birim_adi, f.tedarikci_id, t.ad as tedarikci_adi, f.fiyat, f.tarih 
            FROM fiyatlar f
            JOIN malzemeler m ON f.malzeme_id = m.id
            JOIN tedarikciler t ON f.tedarikci_id = t.id";
    
    $whereClauses = [];
    if (!empty($params['malzeme_id'])) {
        $whereClauses[] = "f.malzeme_id = '" . $conn->real_escape_string($params['malzeme_id']) . "'";
    }
    if (!empty($params['tedarikci_id'])) {
        $whereClauses[] = "f.tedarikci_id = '" . $conn->real_escape_string($params['tedarikci_id']) . "'";
    }
    if (!empty($params['tarih_baslangic'])) {
        $whereClauses[] = "f.tarih >= '" . $conn->real_escape_string($params['tarih_baslangic']) . "'";
    }
    if (!empty($params['tarih_bitis'])) {
        $whereClauses[] = "f.tarih <= '" . $conn->real_escape_string($params['tarih_bitis']) . "'";
    }

    if (count($whereClauses) > 0) {
        $sql .= " WHERE " . implode(" AND ", $whereClauses);
    }
    
    $sql .= " ORDER BY f.tarih DESC, m.ad ASC"; // Önce en yeni tarihe göre, sonra malzeme adına göre sırala

    // Limit ekleme (örneğin son X fiyat için)
    if (!empty($params['limit']) && is_numeric($params['limit'])) {
        $sql .= " LIMIT " . intval($params['limit']);
    }

    $result = $conn->query($sql);
    $fiyatlar = array();

    if ($result) {
        if ($result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $fiyatlar[] = $row;
            }
        }
        ob_clean();
        echo json_encode($fiyatlar);
    } else {
        ob_clean();
        http_response_code(500);
        echo json_encode(
            array("message" => "Fiyatlar getirilirken bir SQL hatası oluştu.", "error" => $conn->error, "sql_debug" => $sql)
        );
    }
}

function deleteFiyat($conn, $id) {
    if (empty($id)) {
        ob_clean();
        http_response_code(400);
        echo json_encode(array("message" => "Silinecek fiyat ID'si belirtilmedi."));
        return;
    }

    // Fiyatın var olup olmadığını kontrol et (opsiyonel ama iyi bir pratik)
    $checkSql = "SELECT id FROM fiyatlar WHERE id = ?";
    $stmtCheck = $conn->prepare($checkSql);
    $stmtCheck->bind_param("i", $id);
    $stmtCheck->execute();
    $resultCheck = $stmtCheck->get_result();

    if ($resultCheck->num_rows === 0) {
        ob_clean();
        http_response_code(404); // Not Found
        echo json_encode(array("message" => "Silinecek fiyat kaydı bulunamadı."));
        $stmtCheck->close();
        return;
    }
    $stmtCheck->close();

    $sql = "DELETE FROM fiyatlar WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $id);

    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            ob_clean();
            echo json_encode(array("message" => "Fiyat kaydı başarıyla silindi."));
        } else {
            // Bu durum normalde yukarıdaki varlık kontrolü ile yakalanmalı, ama bir güvenlik önlemi
            ob_clean();
            http_response_code(404);
            echo json_encode(array("message" => "Silinecek fiyat kaydı bulunamadı veya zaten silinmiş."));
        }
    } else {
        ob_clean();
        http_response_code(500);
        echo json_encode(array("message" => "Fiyat kaydı silinirken SQL hatası oluştu.", "error" => $stmt->error));
    }
    $stmt->close();
}

function handleBulkDelete($conn, $params) {
    $deleted = false;
    $item_id = null;
    $type = null;

    if (!empty($params['malzeme_id'])) {
        $item_id = $conn->real_escape_string($params['malzeme_id']);
        $type = 'malzeme';
        $sql = "DELETE FROM fiyatlar WHERE malzeme_id = '$item_id'";
    } elseif (!empty($params['tedarikci_id'])) {
        $item_id = $conn->real_escape_string($params['tedarikci_id']);
        $type = 'tedarikçi';
        $sql = "DELETE FROM fiyatlar WHERE tedarikci_id = '$item_id'";
    } else {
        ob_clean();
        http_response_code(400);
        echo json_encode(array("message" => "Silme için malzeme_id veya tedarikci_id belirtilmedi."));
        return;
    }

    if ($conn->query($sql) === TRUE) {
        ob_clean();
        echo json_encode(array("message" => ucfirst($type) . " ID'si '{$item_id}' olan ilişkili tüm fiyatlar başarıyla silindi."));
        $deleted = true;
    } else {
        ob_clean();
        http_response_code(500);
        echo json_encode(array("message" => ucfirst($type) . " ID'si '{$item_id}' olan ilişkili fiyatlar silinirken SQL hatası oluştu.", "error" => $conn->error));
    }
    // Bu fonksiyon, malzeme veya tedarikçi silinirken ana API dosyalarından çağrılabilir.
}


$conn->close();
?> 