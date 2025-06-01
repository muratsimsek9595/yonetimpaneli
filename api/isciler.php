<?php
// Çıktı tamponlamasını başlat ve mevcut çıktıları temizle
ob_start();
if (ob_get_level() > 0) {
    ob_clean();
}

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once '../config/db_config.php'; // Veritabanı bağlantısı

$method = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? $conn->real_escape_string(trim($_GET['id'])) : null;

// CORS Başlıkları
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($method == 'OPTIONS') {
    http_response_code(200);
    if (ob_get_level() > 0) { ob_end_clean(); }
    exit();
}

switch ($method) {
    case 'GET':
        if ($id) {
            getIsci($conn, $id);
        } else {
            getIsciler($conn);
        }
        break;
    case 'POST':
        addIsci($conn);
        break;
    case 'PUT':
        if ($id) {
            updateIsci($conn, $id);
        } else {
            http_response_code(400);
            echo json_encode(array("message" => "Güncellenecek işçi ID\'si belirtilmedi."));
        }
        break;
    case 'DELETE':
        if ($id) {
            deleteIsci($conn, $id);
        } else {
            http_response_code(400);
            echo json_encode(array("message" => "Silinecek işçi ID\'si belirtilmedi."));
        }
        break;
    default:
        http_response_code(405);
        echo json_encode(array("message" => "Desteklenmeyen Metod: " . $method));
        break;
}

function getIsciler($conn) {
    // Aktif ve pasif tüm işçileri çekebilir veya sadece aktif olanları: "SELECT * FROM isciler WHERE aktif = TRUE ORDER BY adSoyad ASC";
    $sql = "SELECT * FROM isciler ORDER BY adSoyad ASC";
    $result = $conn->query($sql);
    $isciler = array();
    if ($result) {
        while($row = $result->fetch_assoc()) {
            // Boolean değerleri PHP true/false olarak değil, JS true/false olarak göndermek için
            if (isset($row['aktif'])) {
                $row['aktif'] = (bool)$row['aktif'];
            }
            $isciler[] = $row;
        }
        http_response_code(200);
    } else {
        http_response_code(500);
        $isciler = array("message" => "İşçiler getirilirken SQL hatası oluştu.", "error" => $conn->error);
    }
    echo json_encode($isciler);
    if (ob_get_level() > 0) { ob_end_clean(); }
}

function getIsci($conn, $id) {
    $sql = "SELECT * FROM isciler WHERE id = ?";
    $stmt = $conn->prepare($sql);
    if ($stmt) {
        $stmt->bind_param("s", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        if ($result->num_rows > 0) {
            $isci = $result->fetch_assoc();
            if (isset($isci['aktif'])) {
                $isci['aktif'] = (bool)$isci['aktif'];
            }
            http_response_code(200);
            echo json_encode($isci);
        } else {
            http_response_code(404);
            echo json_encode(array("message" => "İşçi bulunamadı. ID: " . $id));
        }
        $stmt->close();
    } else {
        http_response_code(500);
        echo json_encode(array("message" => "İşçi getirilirken SQL hazırlama hatası oluştu.", "error" => $conn->error));
    }
    if (ob_get_level() > 0) { ob_end_clean(); }
}

function addIsci($conn) {
    $data = json_decode(file_get_contents("php://input"));

    // ID alanı artık yeni eklemelerde beklenmiyor, sadece adSoyad kontrol edilecek.
    if (empty($data->adSoyad)) {
        http_response_code(400);
        echo json_encode(array("message" => "İşçi eklemek için gerekli alan (adSoyad) eksik."));
        if (ob_get_level() > 0) { ob_end_clean(); }
        return;
    }

    // $id = $conn->real_escape_string(trim($data->id)); // ID artık payload'dan alınmayacak.
    $adSoyad = $conn->real_escape_string(trim($data->adSoyad));
    $pozisyon = isset($data->pozisyon) ? $conn->real_escape_string(trim($data->pozisyon)) : null;
    $gunlukUcret = isset($data->gunlukUcret) ? floatval($data->gunlukUcret) : 0.00;
    $saatlikUcret = isset($data->saatlikUcret) ? floatval($data->saatlikUcret) : 0.00;
    $paraBirimi = isset($data->paraBirimi) ? $conn->real_escape_string(trim($data->paraBirimi)) : 'TL';
    $iseBaslamaTarihi = isset($data->iseBaslamaTarihi) && !empty($data->iseBaslamaTarihi) ? $conn->real_escape_string(trim($data->iseBaslamaTarihi)) : null;
    $aktif = isset($data->aktif) ? (bool)$data->aktif : true; // Varsayılan olarak true
    $telefon = isset($data->telefon) ? $conn->real_escape_string(trim($data->telefon)) : null;
    $email = isset($data->email) ? $conn->real_escape_string(trim($data->email)) : null;
    $adres = isset($data->adres) ? $conn->real_escape_string(trim($data->adres)) : null;
    $notlar = isset($data->notlar) ? $conn->real_escape_string(trim($data->notlar)) : null;

    // ID benzersizlik kontrolü yeni eklemeler için kaldırıldı, ID veritabanı tarafından atanacak (AUTO_INCREMENT varsayımı)
    /*
    $checkSql = "SELECT id FROM isciler WHERE id = ?";
    $stmt_check = $conn->prepare($checkSql);
    if (!$stmt_check) {
        http_response_code(500);
        echo json_encode(array("message" => "ID kontrolü SQL hazırlama hatası.", "error" => $conn->error));
        if (ob_get_level() > 0) { ob_end_clean(); }
        return;
    }
    $stmt_check->bind_param("s", $id);
    $stmt_check->execute();
    if ($stmt_check->get_result()->num_rows > 0) {
        $stmt_check->close();
        http_response_code(409); // Conflict
        echo json_encode(array("message" => "Bu ID (\\'$id\\') ile zaten bir işçi kayıtlı."));
        if (ob_get_level() > 0) { ob_end_clean(); }
        return;
    }
    $stmt_check->close();
    */

    // SQL INSERT sorgusu ID olmadan (AUTO_INCREMENT varsayımı)
    $sql = "INSERT INTO isciler (adSoyad, pozisyon, gunlukUcret, saatlikUcret, paraBirimi, iseBaslamaTarihi, aktif, telefon, email, adres, notlar) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    $stmt = $conn->prepare($sql);
    if ($stmt) {
        // iseBaslamaTarihi null olabilir, aktif için integer (0 veya 1)
        $aktif_int = $aktif ? 1 : 0;
        // bind_param ID olmadan güncellendi (sdddsdsisss -> ssdddsdsisss)
        $stmt->bind_param("ssdddsdsiss", $adSoyad, $pozisyon, $gunlukUcret, $saatlikUcret, $paraBirimi, $iseBaslamaTarihi, $aktif_int, $telefon, $email, $adres, $notlar);
        if ($stmt->execute()) {
            $last_id = $conn->insert_id; // Eklenen son ID'yi al
            http_response_code(201);
            // Dönen veriye eklenen ID'yi ve diğer alanları ekle
            $responseData = array(
                "id" => $last_id,
                "adSoyad" => $adSoyad,
                "pozisyon" => $pozisyon,
                "gunlukUcret" => $gunlukUcret,
                "saatlikUcret" => $saatlikUcret,
                "paraBirimi" => $paraBirimi,
                "iseBaslamaTarihi" => $iseBaslamaTarihi,
                "aktif" => $aktif, // Boolean olarak
                "telefon" => $telefon,
                "email" => $email,
                "adres" => $adres,
                "notlar" => $notlar
            );
            echo json_encode(array("message" => "İşçi başarıyla eklendi.", "data" => $responseData));
        } else {
            http_response_code(500);
            echo json_encode(array("message" => "İşçi eklenirken SQL hatası oluştu.", "error" => $stmt->error));
        }
        $stmt->close();
    } else {
        http_response_code(500);
        echo json_encode(array("message" => "İşçi eklenirken SQL hazırlama hatası oluştu.", "error" => $conn->error));
    }
    if (ob_get_level() > 0) { ob_end_clean(); }
}

function updateIsci($conn, $id_param) {
    $data = json_decode(file_get_contents("php://input"));
    $isci_id_url = $conn->real_escape_string(trim($id_param));

    if (empty($data->adSoyad)) {
        http_response_code(400);
        echo json_encode(array("message" => "İşçi güncellemek için 'adSoyad' alanı gereklidir."));
        if (ob_get_level() > 0) { ob_end_clean(); }
        return;
    }

    // İşçinin var olup olmadığını kontrol et
    $checkSql = "SELECT id FROM isciler WHERE id = ?";
    $stmt_check = $conn->prepare($checkSql);
     if (!$stmt_check) {
        http_response_code(500);
        echo json_encode(array("message" => "İşçi varlık SQL hazırlama hatası.", "error" => $conn->error));
        if (ob_get_level() > 0) { ob_end_clean(); }
        return;
    }
    $stmt_check->bind_param("s", $isci_id_url);
    $stmt_check->execute();
    if ($stmt_check->get_result()->num_rows == 0) {
        $stmt_check->close();
        http_response_code(404);
        echo json_encode(array("message" => "Güncellenecek işçi bulunamadı. ID: " . $isci_id_url));
        if (ob_get_level() > 0) { ob_end_clean(); }
        return;
    }
    $stmt_check->close();

    $adSoyad = $conn->real_escape_string(trim($data->adSoyad));
    $pozisyon = isset($data->pozisyon) ? $conn->real_escape_string(trim($data->pozisyon)) : null;
    $gunlukUcret = isset($data->gunlukUcret) ? floatval($data->gunlukUcret) : null; // Null olabilir eğer güncellenmiyorsa
    $saatlikUcret = isset($data->saatlikUcret) ? floatval($data->saatlikUcret) : null;
    $paraBirimi = isset($data->paraBirimi) ? $conn->real_escape_string(trim($data->paraBirimi)) : null;
    $iseBaslamaTarihi = isset($data->iseBaslamaTarihi) && !empty($data->iseBaslamaTarihi) ? $conn->real_escape_string(trim($data->iseBaslamaTarihi)) : (isset($data->iseBaslamaTarihi) && $data->iseBaslamaTarihi === null ? null : false); // false ise güncellenmez, null ise null yapılır
    $aktif = isset($data->aktif) ? (bool)$data->aktif : null; // null olabilir eğer güncellenmiyorsa
    $telefon = isset($data->telefon) ? $conn->real_escape_string(trim($data->telefon)) : null;
    $email = isset($data->email) ? $conn->real_escape_string(trim($data->email)) : null;
    $adres = isset($data->adres) ? $conn->real_escape_string(trim($data->adres)) : null;
    $notlar = isset($data->notlar) ? $conn->real_escape_string(trim($data->notlar)) : null;

    // Dinamik UPDATE sorgusu oluşturma (sadece gönderilen alanları güncellemek için)
    $fields = [];
    $params = [];
    $types = "";

    if ($adSoyad !== null) { $fields[] = "adSoyad = ?"; $params[] = $adSoyad; $types .= "s"; }
    if ($pozisyon !== null) { $fields[] = "pozisyon = ?"; $params[] = $pozisyon; $types .= "s"; }
    if ($gunlukUcret !== null) { $fields[] = "gunlukUcret = ?"; $params[] = $gunlukUcret; $types .= "d"; }
    if ($saatlikUcret !== null) { $fields[] = "saatlikUcret = ?"; $params[] = $saatlikUcret; $types .= "d"; }
    if ($paraBirimi !== null) { $fields[] = "paraBirimi = ?"; $params[] = $paraBirimi; $types .= "s"; }
    if ($iseBaslamaTarihi !== false) { $fields[] = "iseBaslamaTarihi = ?"; $params[] = $iseBaslamaTarihi; $types .= "s"; } // null ise null yapar
    if ($aktif !== null) { $fields[] = "aktif = ?"; $params[] = $aktif ? 1 : 0; $types .= "i"; }
    if ($telefon !== null) { $fields[] = "telefon = ?"; $params[] = $telefon; $types .= "s"; }
    if ($email !== null) { $fields[] = "email = ?"; $params[] = $email; $types .= "s"; }
    if ($adres !== null) { $fields[] = "adres = ?"; $params[] = $adres; $types .= "s"; }
    if ($notlar !== null) { $fields[] = "notlar = ?"; $params[] = $notlar; $types .= "s"; }

    if (count($fields) == 0) {
        http_response_code(400);
        echo json_encode(array("message" => "Güncellenecek bir alan gönderilmedi."));
        if (ob_get_level() > 0) { ob_end_clean(); }
        return;
    }

    $sql = "UPDATE isciler SET " . implode(", ", $fields) . " WHERE id = ?";
    $params[] = $isci_id_url;
    $types .= "s";

    $stmt = $conn->prepare($sql);
    if ($stmt) {
        $stmt->bind_param($types, ...$params);
        if ($stmt->execute()) {
            if ($stmt->affected_rows > 0) {
                http_response_code(200);
                // Güncellenmiş işçi verisini geri döndür
                getIsci($conn, $isci_id_url);
                exit();
            } else {
                http_response_code(200); // Veya 304 Not Modified
                echo json_encode(array("message" => "İşçi bilgileri güncellendi ancak gönderilen veriler mevcut verilerle aynıydı veya güncellenecek alan yoktu."));
            }
        } else {
            http_response_code(500);
            echo json_encode(array("message" => "İşçi güncellenirken SQL hatası oluştu.", "error" => $stmt->error));
        }
        $stmt->close();
    } else {
        http_response_code(500);
        echo json_encode(array("message" => "İşçi güncellenirken SQL hazırlama hatası oluştu.", "error" => $conn->error));
    }
    if (ob_get_level() > 0) { ob_end_clean(); }
}


function deleteIsci($conn, $id_param) {
    $id = $conn->real_escape_string(trim($id_param));

    // İşçinin var olup olmadığını kontrol et
    $checkSql = "SELECT id FROM isciler WHERE id = ?";
    $stmt_check = $conn->prepare($checkSql);
    if (!$stmt_check) {
        http_response_code(500);
        echo json_encode(array("message" => "İşçi varlık SQL hazırlama hatası.", "error" => $conn->error));
        if (ob_get_level() > 0) { ob_end_clean(); }
        return;
    }
    $stmt_check->bind_param("s", $id);
    $stmt_check->execute();
    if ($stmt_check->get_result()->num_rows == 0) {
        $stmt_check->close();
        http_response_code(404);
        echo json_encode(array("message" => "Silinecek işçi bulunamadı. ID: " . $id));
        if (ob_get_level() > 0) { ob_end_clean(); }
        return;
    }
    $stmt_check->close();

    // İPUCU: İşçi silinmeden önce bu işçiye referans veren teklif_kalemleri'ndeki
    // kayıtların ne olacağına karar verilmelidir. Örneğin, referans_id'yi NULL yapmak
    // veya silmeyi engellemek gibi. Şimdilik doğrudan siliyoruz.
    // $updateTeklifKalemleriSql = "UPDATE teklif_kalemleri SET referans_id = NULL WHERE kalemTipi = \'iscilik\' AND referans_id = ?";
    // $stmtUK = $conn->prepare($updateTeklifKalemleriSql);
    // $stmtUK->bind_param("s", $id);
    // $stmtUK->execute();
    // $stmtUK->close();

    $sql = "DELETE FROM isciler WHERE id = ?";
    $stmt = $conn->prepare($sql);
    if ($stmt) {
        $stmt->bind_param("s", $id);
        if ($stmt->execute()) {
            if ($stmt->affected_rows > 0) {
                http_response_code(200); // Veya 204
                echo json_encode(array("message" => "İşçi başarıyla silindi."));
            } else {
                http_response_code(404);
                echo json_encode(array("message" => "Silinecek işçi bulunamadı (veya zaten silinmişti)."));
            }
        } else {
            http_response_code(500);
            echo json_encode(array("message" => "İşçi silinirken SQL hatası oluştu.", "error" => $stmt->error));
        }
        $stmt->close();
    } else {
        http_response_code(500);
        echo json_encode(array("message" => "İşçi silinirken SQL hazırlama hatası oluştu.", "error" => $conn->error));
    }
    if (ob_get_level() > 0) { ob_end_clean(); }
}

if (isset($conn)) {
    $conn->close();
}
if (ob_get_level() > 0) {
    ob_end_flush();
}
?> 