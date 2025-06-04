<?php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *"); // Geliştirme için, canlıda kısıtlayın
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Veritabanı bağlantısını dahil et (kendi bağlantı dosyanızın yolunu belirtin)
require_once '../config/db.php'; // Örnek yol, projenize göre ayarlayın

// ---- REQUIRE_ONCE TESTİ ----
echo json_encode(["success" => true, "message" => "require_once '../config/db.php' satırı çalıştı, dosya muhtemelen bulundu ve ölümcül bir hata vermedi."]);
exit(); // Testten sonra bu satırı kaldırın
// ---- TEST SONU ----

$method = $_SERVER['REQUEST_METHOD'];

// OPTIONS isteğini işle (CORS preflight için)
if ($method == "OPTIONS") {
    http_response_code(200);
    exit();
}

// Temel bir PDO nesnesi bekliyoruz (db.php'den)
if (!isset($pdo)) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Veritabanı bağlantısı kurulamadı."]);
    exit();
}

try {
    switch ($method) {
        case 'GET':
            if (isset($_GET['id'])) {
                $stmt = $pdo->prepare("SELECT * FROM araclar WHERE id = ?");
                $stmt->execute([$_GET['id']]);
                $arac = $stmt->fetch(PDO::FETCH_ASSOC);
                if ($arac) {
                    echo json_encode(["success" => true, "data" => $arac]);
                } else {
                    http_response_code(404);
                    echo json_encode(["success" => false, "message" => "Araç bulunamadı."]);
                }
            } else {
                $stmt = $pdo->query("SELECT * FROM araclar ORDER BY ad ASC");
                $araclar = $stmt->fetchAll(PDO::FETCH_ASSOC);
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

            $sql = "INSERT INTO araclar (ad, yol, aciklama, icon, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                $data['ad'],
                $data['yol'],
                $data['aciklama'] ?? null,
                $data['icon'] ?? null
            ]);
            $lastId = $pdo->lastInsertId();
            echo json_encode(["success" => true, "message" => "Araç başarıyla eklendi.", "data" => ["id" => $lastId] + $data]);
            break;

        case 'PUT':
            $id = $_GET['id'] ?? null;
            if (!$id) {
                http_response_code(400);
                echo json_encode(["success" => false, "message" => "Güncellenecek araç ID'si belirtilmedi."]);
                exit();
            }

            $data = json_decode(file_get_contents('php://input'), true);

            if (empty($data['ad']) || empty($data['yol'])) {
                http_response_code(400);
                echo json_encode(["success" => false, "message" => "Araç adı ve yolu boş bırakılamaz."]);
                exit();
            }

            $sql = "UPDATE araclar SET ad = ?, yol = ?, aciklama = ?, icon = ?, updated_at = NOW() WHERE id = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                $data['ad'],
                $data['yol'],
                $data['aciklama'] ?? null,
                $data['icon'] ?? null,
                $id
            ]);

            if ($stmt->rowCount() > 0) {
                echo json_encode(["success" => true, "message" => "Araç başarıyla güncellendi.", "data" => ["id" => $id] + $data]);
            } else {
                // Belki ID bulunamadı veya veri aynıydı, yine de başarılı kabul edilebilir
                // Ya da daha katı bir kontrol için 404 veya 304 döndürülebilir.
                // Şimdilik, eğer sorgu çalıştı ama satır etkilenmediyse, verinin aynı olduğunu varsayalım.
                $stmt_check = $pdo->prepare("SELECT id FROM araclar WHERE id = ?");
                $stmt_check->execute([$id]);
                if ($stmt_check->fetch()) {
                     echo json_encode(["success" => true, "message" => "Araç verileri zaten güncel veya değişiklik yapılmadı.", "data" => ["id" => $id] + $data]);
                } else {
                    http_response_code(404);
                    echo json_encode(["success" => false, "message" => "Güncellenecek araç bulunamadı."]);
                }
            }
            break;

        case 'DELETE':
            $id = $_GET['id'] ?? null;
            if (!$id) {
                http_response_code(400);
                echo json_encode(["success" => false, "message" => "Silinecek araç ID'si belirtilmedi."]);
                exit();
            }

            $stmt = $pdo->prepare("DELETE FROM araclar WHERE id = ?");
            $stmt->execute([$id]);

            if ($stmt->rowCount() > 0) {
                echo json_encode(["success" => true, "message" => "Araç başarıyla silindi."]);
            } else {
                http_response_code(404);
                echo json_encode(["success" => false, "message" => "Silinecek araç bulunamadı veya zaten silinmiş."]);
            }
            break;

        default:
            http_response_code(405);
            echo json_encode(["success" => false, "message" => "İzin verilmeyen metot."]);
            break;
    }
} catch (PDOException $e) {
    http_response_code(500);
    // Geliştirme sırasında detaylı hata, canlıda genel mesaj:
    echo json_encode(["success" => false, "message" => "Veritabanı hatası: " . $e->getMessage()]);
    // echo json_encode(["success" => false, "message" => "Sunucu tarafında bir hata oluştu."]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Genel bir hata oluştu: " . $e->getMessage()]);
}

?> 