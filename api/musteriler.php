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

// Veritabanı bağlantısı
// db_config.php dosyasının doğru yolda olduğundan emin olun
// Bu dosya genellikle $conn = new mysqli(DB_SERVER, DB_USERNAME, DB_PASSWORD, DB_NAME); gibi bir bağlantı içerir
// ve karakter setini mysqli_set_charset($conn, "utf8mb4"); ile ayarlar.
require_once '../config/db_config.php'; 

// Test echo ve exit kaldırıldı
// echo json_encode(["status" => "test_ok_after_db_config", "message" => "API script processed db_config.php", "db_conn_error" => isset($conn) ? $conn->connect_error : "conn_not_set"]);
// exit;

// $conn bağlantısının varlığını kontrol et (db_config.php sonrası hemen yapılmalı)
if (!$conn || $conn->connect_error) { // $conn null olabilir VEYA connect_error set edilmiş olabilir
    http_response_code(503); 
    // Content-Type zaten en başta ayarlandığı için burada tekrar set etmeye gerek yok.
    echo json_encode(array("message" => "Veritabanı bağlantısı kurulamadı.", "error_detail" => ($conn ? $conn->connect_error : "Bağlantı nesnesi oluşturulamadı.")));
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];
$id_param = null;
if (isset($_GET['id'])) {
    $id_param = trim($_GET['id']); 
}

// CORS BAŞLIKLARI YUKARI TAŞINDI
// header("Access-Control-Allow-Origin: *");
// header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
// header("Access-Control-Max-Age: 3600");
// header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// OPTIONS İSTEĞİ YUKARI TAŞINDI
// if ($method == 'OPTIONS') {
//    http_response_code(200);
//    exit();
// }

// $conn BAĞLANTI KONTROLÜ YUKARI TAŞINDI VE GÜÇLENDİRİLDİ
// if (!$conn) {
//    http_response_code(503); 
//    echo json_encode(array("message" => "Veritabanı bağlantısı kurulamadı."));
//    exit();
// }

switch ($method) {
    case 'GET':
        if ($id_param !== null) {
            getMusteri($conn, $id_param);
        } else {
            getMusteriler($conn);
        }
        break;
    case 'POST':
        addMusteri($conn);
        break;
    case 'PUT':
        if ($id_param !== null) {
            updateMusteri($conn, $id_param);
        } else {
            http_response_code(400); 
            echo json_encode(array("message" => "Güncellenecek müşteri ID'si belirtilmedi."));
        }
        break;
    case 'DELETE':
        if ($id_param !== null) {
            deleteMusteri($conn, $id_param);
        } else {
            http_response_code(400); 
            echo json_encode(array("message" => "Silinecek müşteri ID'si belirtilmedi."));
        }
        break;
    default:
        http_response_code(405); 
        echo json_encode(array("message" => "Desteklenmeyen Metod: " . $method));
        break;
}

function getMusteriler($conn) {
    $sql = "SELECT id, adi, yetkiliKisi, telefon, email, adres, vergiNo, notlar FROM musteriler ORDER BY adi ASC";
    $result = $conn->query($sql);
    $musteriler = array();
    if ($result) {
        while($row = $result->fetch_assoc()) {
            $row['id'] = intval($row['id']); // ID'yi integer olarak döndür
            $musteriler[] = $row;
        }
        http_response_code(200);
    } else {
        http_response_code(500);
        $musteriler = array("message" => "Müşteriler getirilirken SQL hatası oluştu.", "error" => $conn->error);
    }
    echo json_encode($musteriler);
}

function getMusteri($conn, $id_str) {
    $id = intval($id_str); // ID'yi integer yap
    if ($id <= 0) {
        http_response_code(400);
        echo json_encode(array("message" => "Geçersiz müşteri ID'si."));
        return;
    }
    $sql = "SELECT id, adi, yetkiliKisi, telefon, email, adres, vergiNo, notlar FROM musteriler WHERE id = ?";
    $stmt = $conn->prepare($sql);
    if ($stmt) {
        $stmt->bind_param("i", $id); // "i" for integer
        $stmt->execute();
        $result = $stmt->get_result();
        if ($result->num_rows > 0) {
            $musteri = $result->fetch_assoc();
            $musteri['id'] = intval($musteri['id']); // ID'yi integer olarak döndür
            http_response_code(200);
            echo json_encode($musteri);
        } else {
            http_response_code(404);
            echo json_encode(array("message" => "Müşteri bulunamadı. ID: " . $id));
        }
        $stmt->close();
    } else {
        http_response_code(500);
        echo json_encode(array("message" => "Müşteri getirilirken SQL hazırlama hatası oluştu.", "error" => $conn->error));
    }
}

function addMusteri($conn) {
    $data = json_decode(file_get_contents("php://input"));

    if (empty($data->adi)) {
        http_response_code(400);
        echo json_encode(array("message" => "Müşteri eklemek için 'adi' alanı zorunludur."));
        return;
    }

    $adi = $conn->real_escape_string(trim($data->adi));
    $yetkiliKisi = isset($data->yetkiliKisi) ? $conn->real_escape_string(trim($data->yetkiliKisi)) : null;
    $telefon = isset($data->telefon) ? $conn->real_escape_string(trim($data->telefon)) : null;
    $email = isset($data->email) ? $conn->real_escape_string(trim($data->email)) : null;
    $adres = isset($data->adres) ? $conn->real_escape_string(trim($data->adres)) : null;
    $vergiNo = isset($data->vergiNo) ? $conn->real_escape_string(trim($data->vergiNo)) : null;
    $notlar = isset($data->notlar) ? $conn->real_escape_string(trim($data->notlar)) : null;
    
    // ID artık veritabanı tarafından AUTO_INCREMENT ile atanacak
    // created_at ve updated_at için NOW() kullanılacak
    $sql = "INSERT INTO musteriler (adi, yetkiliKisi, telefon, email, adres, vergiNo, notlar, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())";
    $stmt = $conn->prepare($sql);

    if ($stmt) {
        // ID kaldırıldığı için 7 string parametre
        $bind_types = "sssssss"; 
        $stmt->bind_param($bind_types, $adi, $yetkiliKisi, $telefon, $email, $adres, $vergiNo, $notlar);

        if ($stmt->execute()) {
            $inserted_id = $conn->insert_id; // Yeni eklenen müşterinin ID'sini al
            http_response_code(201);
            echo json_encode(array(
                "message" => "Müşteri başarıyla eklendi.", 
                "data" => array(
                    "id" => intval($inserted_id), // Integer olarak ID
                    "adi" => $adi,
                    "yetkiliKisi" => $yetkiliKisi,
                    "telefon" => $telefon,
                    "email" => $email,
                    "adres" => $adres,
                    "vergiNo" => $vergiNo,
                    "notlar" => $notlar
                )
            ));
        } else {
            http_response_code(500);
            echo json_encode(array("message" => "Müşteri eklenirken SQL hatası oluştu.", "error" => $stmt->error, "sql_errno" => $stmt->errno));
        }
        $stmt->close();
    } else {
        http_response_code(500);
        echo json_encode(array("message" => "Müşteri eklenirken SQL hazırlama hatası oluştu.", "error" => $conn->error));
    }
}

function updateMusteri($conn, $id_str) {
    $id = intval($id_str); // ID'yi integer yap
    if ($id <= 0) {
        http_response_code(400);
        echo json_encode(array("message" => "Geçersiz müşteri ID'si."));
        return;
    }

    $data = json_decode(file_get_contents("php://input"));

    if (empty($data->adi)) { 
        http_response_code(400);
        echo json_encode(array("message" => "Müşteri güncellemek için 'adi' alanı gereklidir."));
        return;
    }

    // Veri temizleme ve atama
    $adi = $conn->real_escape_string(trim($data->adi));
    $yetkiliKisi = isset($data->yetkiliKisi) ? $conn->real_escape_string(trim($data->yetkiliKisi)) : null;
    $telefon = isset($data->telefon) ? $conn->real_escape_string(trim($data->telefon)) : null;
    $email = isset($data->email) ? $conn->real_escape_string(trim($data->email)) : null;
    $adres = isset($data->adres) ? $conn->real_escape_string(trim($data->adres)) : null;
    $vergiNo = isset($data->vergiNo) ? $conn->real_escape_string(trim($data->vergiNo)) : null;
    $notlar = isset($data->notlar) ? $conn->real_escape_string(trim($data->notlar)) : null;

    // updated_at için NOW() kullanılacak
    $sql = "UPDATE musteriler SET adi = ?, yetkiliKisi = ?, telefon = ?, email = ?, adres = ?, vergiNo = ?, notlar = ?, updated_at = NOW() WHERE id = ?";
    $stmt = $conn->prepare($sql);

    if ($stmt) {
        // 7 string, 1 integer (id)
        $bind_types = "sssssssi"; 
        $stmt->bind_param($bind_types, $adi, $yetkiliKisi, $telefon, $email, $adres, $vergiNo, $notlar, $id);
        if ($stmt->execute()) {
            if ($stmt->affected_rows > 0) {
                http_response_code(200);
                 echo json_encode(array(
                    "message" => "Müşteri başarıyla güncellendi.",
                    "data" => array(
                        "id" => $id,
                        "adi" => $adi,
                        "yetkiliKisi" => $yetkiliKisi,
                        "telefon" => $telefon,
                        "email" => $email,
                        "adres" => $adres,
                        "vergiNo" => $vergiNo,
                        "notlar" => $notlar
                    )
                ));
            } else {
                // Müşteri bulundu ama hiçbir değişiklik yapılmadı veya ID bulunamadı (prepare sonrası nadir)
                // ID bulunamadıysa, execute 0 affected_rows döndürür. 
                // Daha iyi bir kontrol için önce müşteri var mı diye bakılabilir ama şimdilik böyle bırakıyorum.
                http_response_code(200); 
                echo json_encode(array("message" => "Müşteri bilgileri güncellenmedi. Veri aynı veya müşteri bulunamadı.", "affected_rows" => $stmt->affected_rows));
            }
        } else {
            http_response_code(500);
            echo json_encode(array("message" => "Müşteri güncellenirken SQL hatası oluştu.", "error" => $stmt->error, "sql_errno" => $stmt->errno));
        }
        $stmt->close();
    } else {
        http_response_code(500);
        echo json_encode(array("message" => "Müşteri güncellenirken SQL hazırlama hatası oluştu.", "error" => $conn->error));
    }
}

function deleteMusteri($conn, $id_str) {
    $id = intval($id_str); // ID'yi integer yap
    if ($id <= 0) {
        http_response_code(400);
        echo json_encode(array("message" => "Geçersiz müşteri ID'si."));
        return;
    }

    $sql = "DELETE FROM musteriler WHERE id = ?";
    $stmt = $conn->prepare($sql);

    if ($stmt) {
        $stmt->bind_param("i", $id); // "i" for integer
        if ($stmt->execute()) {
            if ($stmt->affected_rows > 0) {
                http_response_code(200); 
                echo json_encode(array("message" => "Müşteri başarıyla silindi."));
            } else {
                http_response_code(404); 
                echo json_encode(array("message" => "Silinecek müşteri bulunamadı."));
            }
        } else {
            http_response_code(500); 
            echo json_encode(array("message" => "Müşteri silinirken SQL hatası oluştu.", "error" => $stmt->error, "sql_errno" => $stmt->errno));
        }
        $stmt->close();
    } else {
        http_response_code(500); 
        echo json_encode(array("message" => "Müşteri silinirken SQL hazırlama hatası oluştu.", "error" => $conn->error));
    }
}

if (isset($conn)) {
    $conn->close();
}
?> 