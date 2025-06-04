<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header("Content-Type: application/json; charset=UTF-8");

// Çalışan teklifler.php dosyasındaki gibi tam yol kullanalım.
require_once '/home/hsnplant/public_html/demo/config/db_config.php';

// Bağlantı kontrolü (teklifler.php'deki gibi)
if ($conn === null) {
    http_response_code(503);
    echo json_encode(array("success" => false, "message" => "Veritabanı bağlantı nesnesi (conn) null."));
    exit();
}
if ($conn->connect_error) {
    http_response_code(503);
    echo json_encode(array("success" => false, "message" => "Veritabanı bağlantısı kurulamadı.", "error" => $conn->connect_error));
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];
$id_url = isset($_GET['id']) ? trim($_GET['id']) : null;

// CORS Başlıkları (teklifler.php'den alındı, Access-Control-Max-Age eklendi)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($method == 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    switch ($method) {
        case 'GET':
            if ($id_url) {
                $stmt = $conn->prepare("SELECT * FROM araclar WHERE id = ?");
                $stmt->bind_param("i", $id_url);
                $stmt->execute();
                $result = $stmt->get_result();
                $arac = $result->fetch_assoc();
                if ($arac) {
                    echo json_encode(["success" => true, "data" => $arac]);
                } else {
                    http_response_code(404);
                    echo json_encode(["success" => false, "message" => "Araç bulunamadı."]);
                }
                $stmt->close();
            } else {
                $result = $conn->query("SELECT * FROM araclar ORDER BY ad ASC");
                $araclar = $result->fetch_all(MYSQLI_ASSOC);
                echo json_encode(["success" => true, "data" => $araclar]);
            }
            break;

        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);

            if (empty($data['ad']) || empty($data['yol'])) {
                http_response_code(400);
                echo json_encode(["success" => false, "message" => "Araç adı ve yolu boş bırakılamaz."]);
                exit();
            }

            $stmt = $conn->prepare("INSERT INTO araclar (ad, yol, aciklama, icon, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())");
            $stmt->bind_param("ssss", 
                $data['ad'], 
                $data['yol'], 
                $data['aciklama'], // mysqli için ?? null operatörü doğrudan kullanılamaz, önceden ayarlanmalı
                $data['icon']
            );
            // ?? null yerine değişken ataması
            $aciklama = $data['aciklama'] ?? null;
            $icon = $data['icon'] ?? null;
            // bind_param için değişkenleri yeniden atayalım
            $stmt->bind_param("ssss", $data['ad'], $data['yol'], $aciklama, $icon);

            if ($stmt->execute()) {
                $lastId = $conn->insert_id;
                // Başarılı yanıtta ID'yi ve gönderilen veriyi birleştirerek döndür
                $responseData = array_merge(['id' => $lastId], $data);
                echo json_encode(["success" => true, "message" => "Araç başarıyla eklendi.", "data" => $responseData]);
            } else {
                http_response_code(500);
                echo json_encode(["success" => false, "message" => "Araç eklenirken SQL hatası oluştu.", "error_detail" => $stmt->error]);
            }
            $stmt->close();
            break;

        case 'PUT':
            // PUT için id URL query parametresinden alınır: /api/araclar.php?id=xxx
            if (!$id_url) {
                http_response_code(400);
                echo json_encode(["success" => false, "message" => "Güncellenecek araç ID'si URL'de belirtilmedi (?id=X)."]);
                exit();
            }

            $data = json_decode(file_get_contents('php://input'), true);

            if (empty($data['ad']) || empty($data['yol'])) {
                http_response_code(400);
                echo json_encode(["success" => false, "message" => "Araç adı ve yolu boş bırakılamaz."]);
                exit();
            }
            
            $aciklama = $data['aciklama'] ?? null;
            $icon = $data['icon'] ?? null;

            $stmt = $conn->prepare("UPDATE araclar SET ad = ?, yol = ?, aciklama = ?, icon = ?, updated_at = NOW() WHERE id = ?");
            $stmt->bind_param("ssssi", $data['ad'], $data['yol'], $aciklama, $icon, $id_url);

            if ($stmt->execute()) {
                if ($stmt->affected_rows > 0) {
                    $responseData = array_merge(['id' => $id_url], $data);
                    echo json_encode(["success" => true, "message" => "Araç başarıyla güncellendi.", "data" => $responseData]);
                } else {
                     // Etkilenen satır yoksa, ID bulunamadı veya veri aynıydı.
                    $checkStmt = $conn->prepare("SELECT id FROM araclar WHERE id = ?");
                    $checkStmt->bind_param("i", $id_url);
                    $checkStmt->execute();
                    $resultCheck = $checkStmt->get_result();
                    if ($resultCheck->num_rows > 0) {
                        $responseData = array_merge(['id' => $id_url], $data);
                        echo json_encode(["success" => true, "message" => "Araç verileri zaten güncel veya değişiklik yapılmadı.", "data" => $responseData]);
                    } else {
                        http_response_code(404);
                        echo json_encode(["success" => false, "message" => "Güncellenecek araç bulunamadı."]);
                    }
                    $checkStmt->close();
                }
            } else {
                http_response_code(500);
                echo json_encode(["success" => false, "message" => "Araç güncellenirken SQL hatası oluştu.", "error_detail" => $stmt->error]);
            }
            $stmt->close();
            break;

        case 'DELETE':
            if (!$id_url) {
                http_response_code(400);
                echo json_encode(["success" => false, "message" => "Silinecek araç ID'si belirtilmedi."]);
                exit();
            }

            $stmt = $conn->prepare("DELETE FROM araclar WHERE id = ?");
            $stmt->bind_param("i", $id_url);
            
            if ($stmt->execute()) {
                if ($stmt->affected_rows > 0) {
                    echo json_encode(["success" => true, "message" => "Araç başarıyla silindi."]);
                } else {
                    http_response_code(404);
                    echo json_encode(["success" => false, "message" => "Silinecek araç bulunamadı veya zaten silinmiş."]);
                }
            } else {
                 http_response_code(500);
                 echo json_encode(["success" => false, "message" => "Araç silinirken SQL hatası oluştu.", "error_detail" => $stmt->error]);
            }
            $stmt->close();
            break;

        default:
            http_response_code(405);
            echo json_encode(["success" => false, "message" => "İzin verilmeyen metot: " . $method]);
            break;
    }
} catch (Exception $e) { // Genel hatalar için Exception (mysqli_sql_exception PDOException yerine)
    http_response_code(500);
    // Geliştirme sırasında detaylı hata, canlıda genel mesaj:
    echo json_encode(["success" => false, "message" => "Sunucu tarafında genel bir hata oluştu: " . $e->getMessage()]);
    // echo json_encode(["success" => false, "message" => "Sunucu tarafında bir hata oluştu."]);
}

if (isset($conn) && is_object($conn) && method_exists($conn, 'close')) {
    $conn->close();
}

?> 