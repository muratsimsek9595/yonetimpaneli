<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *"); // Geliştirme için, canlıda daha kısıtlı olmalı
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../config/database.php'; // Veritabanı bağlantı dosyanız
require_once '../config/config.php';   // Gerekirse genel ayar dosyanız
require_once '../includes/functions.php'; // Genel fonksiyonlarınız (örn: generate_uuid)

$method = $_SERVER['REQUEST_METHOD'];

// OPTIONS isteği için ön kontrol (CORS için)
if ($method == "OPTIONS") {
    http_response_code(200);
    exit();
}

$conn = db_connect(); // Veritabanı bağlantısını al

if (!$conn) {
    http_response_code(503); // Service Unavailable
    echo json_encode(array("message" => "Veritabanı bağlantısı kurulamadı."));
    exit();
}

switch ($method) {
    case 'GET':
        if (isset($_GET['id'])) {
            getIsci($conn, $_GET['id']);
        } else {
            getIsciler($conn);
        }
        break;
    case 'POST':
        addIsci($conn);
        break;
    case 'PUT':
        updateIsci($conn);
        break;
    case 'DELETE':
        if (isset($_GET['id'])) {
            deleteIsci($conn, $_GET['id']);
        } else {
            http_response_code(400);
            echo json_encode(array("message" => "Silinecek işçi ID'si belirtilmedi."));
        }
        break;
    default:
        http_response_code(405); // Method Not Allowed
        echo json_encode(array("message" => "Desteklenmeyen metod."));
        break;
}

if ($conn) {
    $conn->close();
}

// İşçileri Listeleme
function getIsciler($conn) {
    $sql = "SELECT * FROM isciler ORDER BY adSoyad ASC";
    $result = $conn->query($sql);
    $isciler = array();
    if ($result && $result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            $row['id'] = (int)$row['id'];
            $row['aktif'] = (bool)$row['aktif'];
            $row['gunlukUcret'] = isset($row['gunlukUcret']) ? (float)$row['gunlukUcret'] : null;
            $row['saatlikUcret'] = isset($row['saatlikUcret']) ? (float)$row['saatlikUcret'] : null;
            // Diğer numeric/boolean alanları da burada dönüştürebilirsiniz.
            $isciler[] = $row;
        }
         http_response_code(200);
         echo json_encode(array("data" => $isciler, "success" => true));
    } else if ($result) {
        http_response_code(200); // Başarılı ama veri yok
        echo json_encode(array("data" => [], "success" => true, "message" => "Kayıtlı işçi bulunamadı."));
    } else {
        http_response_code(500);
        echo json_encode(array("message" => "İşçi listesi alınırken bir hata oluştu: " . $conn->error, "success" => false));
    }
}

// Tek İşçi Getirme
function getIsci($conn, $id) {
    if (!is_numeric($id) || (int)$id <= 0) {
        http_response_code(400);
        echo json_encode(array("message" => "Geçersiz İşçi ID'si.", "success" => false));
        return;
    }
    $id_int = (int)$id;
    
    $sql = "SELECT * FROM isciler WHERE id = ?";
    $stmt = $conn->prepare($sql);
    if ($stmt === false) {
        http_response_code(500);
        echo json_encode(array("message" => "SQL prepare error: " . $conn->error, "success" => false));
        return;
    }
    $stmt->bind_param("i", $id_int);
    
    if ($stmt->execute()) {
        $result = $stmt->get_result();
        if ($result->num_rows > 0) {
            $row = $result->fetch_assoc();
            $row['id'] = (int)$row['id'];
            $row['aktif'] = (bool)$row['aktif'];
            $row['gunlukUcret'] = isset($row['gunlukUcret']) ? (float)$row['gunlukUcret'] : null;
            $row['saatlikUcret'] = isset($row['saatlikUcret']) ? (float)$row['saatlikUcret'] : null;
            http_response_code(200);
            echo json_encode(array("data" => $row, "success" => true));
        } else {
            http_response_code(404);
            echo json_encode(array("message" => "İşçi bulunamadı. ID: " . $id_int, "success" => false));
        }
    } else {
        http_response_code(500);
        echo json_encode(array("message" => "İşçi getirme hatası: " . $stmt->error, "success" => false));
    }
    $stmt->close();
}

// Yeni İşçi Ekleme
function addIsci($conn) {
    $data = json_decode(file_get_contents("php://input"));

    if (!$data) {
        http_response_code(400);
        echo json_encode(array("message" => "Geçersiz JSON verisi.", "success" => false));
        return;
    }

    if (!isset($data->adSoyad) || empty(trim($data->adSoyad))) {
        http_response_code(400);
        echo json_encode(array("message" => "Ad Soyad alanı zorunludur.", "success" => false));
        return;
    }

    $adSoyad = $conn->real_escape_string(trim($data->adSoyad));
    $pozisyon = isset($data->pozisyon) ? $conn->real_escape_string(trim($data->pozisyon)) : null;
    $gunlukUcret = isset($data->gunlukUcret) && is_numeric($data->gunlukUcret) ? (float)$data->gunlukUcret : null;
    $saatlikUcret = isset($data->saatlikUcret) && is_numeric($data->saatlikUcret) ? (float)$data->saatlikUcret : null;
    $paraBirimi = isset($data->paraBirimi) && !empty(trim($data->paraBirimi)) ? $conn->real_escape_string(trim($data->paraBirimi)) : 'TL';
    $iseBaslamaTarihi = isset($data->iseBaslamaTarihi) && !empty($data->iseBaslamaTarihi) ? $conn->real_escape_string(trim($data->iseBaslamaTarihi)) : null;
    // Gelen 'aktif' değerini doğru şekilde işle: true, "true", 1 -> 1; false, "false", 0 -> 0
    $aktif_int = 0;
    if (isset($data->aktif)) {
        if ($data->aktif === true || strtolower((string)$data->aktif) === 'true' || (int)$data->aktif === 1) {
            $aktif_int = 1;
        }
    } else {
        $aktif_int = 1; // Varsayılan olarak aktif
    }

    $telefon = isset($data->telefon) ? $conn->real_escape_string(trim($data->telefon)) : null;
    $email = isset($data->email) && filter_var($data->email, FILTER_VALIDATE_EMAIL) ? $conn->real_escape_string(trim($data->email)) : null;
    $adres = isset($data->adres) ? $conn->real_escape_string(trim($data->adres)) : null;
    $notlar = isset($data->notlar) ? $conn->real_escape_string(trim($data->notlar)) : null;
    
    // Tarih formatını kontrol et (YYYY-MM-DD)
    if ($iseBaslamaTarihi !== null && !preg_match("/^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])$/", $iseBaslamaTarihi)) {
        $iseBaslamaTarihi = null; // Geçersiz format ise null yap
    }


    $sql = "INSERT INTO isciler (adSoyad, pozisyon, gunlukUcret, saatlikUcret, paraBirimi, iseBaslamaTarihi, aktif, telefon, email, adres, notlar) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    
    $stmt = $conn->prepare($sql);
    if ($stmt === false) {
        http_response_code(500);
        echo json_encode(array("message" => "SQL prepare error: " . $conn->error, "sql_error_details" => $conn->error, "success" => false));
        return;
    }
    
    $stmt->bind_param("ssddssissss", 
        $adSoyad, $pozisyon, $gunlukUcret, $saatlikUcret, $paraBirimi, 
        $iseBaslamaTarihi, $aktif_int, $telefon, $email, $adres, $notlar
    );

    if ($stmt->execute()) {
        $last_id = $stmt->insert_id;
        // Eklenen işçiyi geri döndür
        getIsci($conn, $last_id); // Bu fonksiyon zaten JSON response ve HTTP code ayarlar
    } else {
        http_response_code(500);
        echo json_encode(array("message" => "İşçi ekleme hatası: " . $stmt->error, "sql_error_details" => $stmt->error, "success" => false));
    }
    $stmt->close();
}

// İşçi Güncelleme
function updateIsci($conn) {
    $data = json_decode(file_get_contents("php://input"));

    if (!$data) {
        http_response_code(400);
        echo json_encode(array("message" => "Geçersiz JSON verisi.", "success" => false));
        return;
    }

    if (!isset($data->id) || !is_numeric($data->id) || (int)$data->id <= 0) {
        http_response_code(400);
        echo json_encode(array("message" => "Geçerli bir işçi ID'si zorunludur.", "success" => false));
        return;
    }
     if (!isset($data->adSoyad) || empty(trim($data->adSoyad))) {
        http_response_code(400);
        echo json_encode(array("message" => "Ad Soyad alanı zorunludur.", "success" => false));
        return;
    }

    $id = (int)$data->id;
    $adSoyad = $conn->real_escape_string(trim($data->adSoyad));
    $pozisyon = isset($data->pozisyon) ? $conn->real_escape_string(trim($data->pozisyon)) : null;
    $gunlukUcret = isset($data->gunlukUcret) && is_numeric($data->gunlukUcret) ? (float)$data->gunlukUcret : (isset($data->gunlukUcret) && $data->gunlukUcret === null ? null : -1); // -1 default değilse
    $saatlikUcret = isset($data->saatlikUcret) && is_numeric($data->saatlikUcret) ? (float)$data->saatlikUcret : (isset($data->saatlikUcret) && $data->saatlikUcret === null ? null : -1);
    $paraBirimi = isset($data->paraBirimi) && !empty(trim($data->paraBirimi)) ? $conn->real_escape_string(trim($data->paraBirimi)) : 'TL';
    $iseBaslamaTarihi = isset($data->iseBaslamaTarihi) && !empty($data->iseBaslamaTarihi) ? $conn->real_escape_string(trim($data->iseBaslamaTarihi)) : null;
    
    $aktif_int = 0; // Varsayılan olarak pasif, eğer data->aktif set edilmişse ona göre ayarla
    if (isset($data->aktif)) {
        if ($data->aktif === true || strtolower((string)$data->aktif) === 'true' || (int)$data->aktif === 1) {
            $aktif_int = 1;
        }
    }


    $telefon = isset($data->telefon) ? $conn->real_escape_string(trim($data->telefon)) : null;
    $email = isset($data->email) && filter_var($data->email, FILTER_VALIDATE_EMAIL) ? $conn->real_escape_string(trim($data->email)) : (isset($data->email) && $data->email === null ? null : ''); // Boş string eğer valid değilse ve null değilse
    $adres = isset($data->adres) ? $conn->real_escape_string(trim($data->adres)) : null;
    $notlar = isset($data->notlar) ? $conn->real_escape_string(trim($data->notlar)) : null;
    
    // Tarih formatını kontrol et (YYYY-MM-DD)
    if ($iseBaslamaTarihi !== null && !preg_match("/^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])$/", $iseBaslamaTarihi)) {
        $iseBaslamaTarihi = null; 
    }
    if ($gunlukUcret === -1) unset($gunlukUcret); // Eğer -1 ise SQL'e dahil etme (yani değeri değiştirme)
    if ($saatlikUcret === -1) unset($saatlikUcret);


    // Hangi alanların güncelleneceğini dinamik olarak belirle
    $fields_to_update = [];
    $params = [];
    $types = "";

    $fields_to_update[] = "adSoyad = ?"; $params[] = $adSoyad; $types .= "s";
    if (isset($data->pozisyon)) {$fields_to_update[] = "pozisyon = ?"; $params[] = $pozisyon; $types .= "s";}
    if (isset($gunlukUcret)) {$fields_to_update[] = "gunlukUcret = ?"; $params[] = $gunlukUcret; $types .= "d";} else if (isset($data->gunlukUcret) && $data->gunlukUcret === null) {$fields_to_update[] = "gunlukUcret = NULL"; }
    if (isset($saatlikUcret)) {$fields_to_update[] = "saatlikUcret = ?"; $params[] = $saatlikUcret; $types .= "d";} else if (isset($data->saatlikUcret) && $data->saatlikUcret === null) {$fields_to_update[] = "saatlikUcret = NULL"; }
    if (isset($data->paraBirimi)) {$fields_to_update[] = "paraBirimi = ?"; $params[] = $paraBirimi; $types .= "s";}
    if (isset($data->iseBaslamaTarihi)) {$fields_to_update[] = "iseBaslamaTarihi = ?"; $params[] = $iseBaslamaTarihi; $types .= "s";} else if (isset($data->iseBaslamaTarihi) && $data->iseBaslamaTarihi === null) {$fields_to_update[] = "iseBaslamaTarihi = NULL";}
    if (isset($data->aktif)) {$fields_to_update[] = "aktif = ?"; $params[] = $aktif_int; $types .= "i";}
    if (isset($data->telefon)) {$fields_to_update[] = "telefon = ?"; $params[] = $telefon; $types .= "s";} else if (isset($data->telefon) && $data->telefon === null) {$fields_to_update[] = "telefon = NULL";}
    if (isset($data->email)) { // email boş string olabilir (silmek için) veya null
        if ($data->email === null) $fields_to_update[] = "email = NULL";
        else {$fields_to_update[] = "email = ?"; $params[] = $email; $types .= "s";}
    }
    if (isset($data->adres)) {$fields_to_update[] = "adres = ?"; $params[] = $adres; $types .= "s";} else if (isset($data->adres) && $data->adres === null) {$fields_to_update[] = "adres = NULL";}
    if (isset($data->notlar)) {$fields_to_update[] = "notlar = ?"; $params[] = $notlar; $types .= "s";} else if (isset($data->notlar) && $data->notlar === null) {$fields_to_update[] = "notlar = NULL";}


    if (count($fields_to_update) === 0) {
        // Eğer sadece ID geldiyse ve adSoyad dışında güncellenecek bir şey yoksa, mevcut veriyi döndür
        getIsci($conn, $id);
        return;
    }
    
    $params[] = $id; $types .= "i";
    $sql = "UPDATE isciler SET " . implode(", ", $fields_to_update) . " WHERE id = ?";
    
    $stmt = $conn->prepare($sql);
    if ($stmt === false) {
        http_response_code(500);
        echo json_encode(array("message" => "SQL prepare error: " . $conn->error, "sql_error_details" => $conn->error, "sql" => $sql, "success" => false));
        return;
    }
    
    // Spread operatörü (...) PHP 5.6+ için
    $stmt->bind_param($types, ...$params);

    if ($stmt->execute()) {
        // Güncellenmiş işçiyi geri döndür
        getIsci($conn, $id);
    } else {
        http_response_code(500);
        echo json_encode(array("message" => "İşçi güncelleme hatası: " . $stmt->error, "sql_error_details" => $stmt->error, "success" => false));
    }
    $stmt->close();
}

// İşçi Silme
function deleteIsci($conn, $id) {
    if (!is_numeric($id) || (int)$id <= 0) {
        http_response_code(400);
        echo json_encode(array("message" => "Geçersiz İşçi ID'si.", "success" => false));
        return;
    }
    $id_int = (int)$id;

    // Önce var olup olmadığını kontrol et
    $check_sql = "SELECT id FROM isciler WHERE id = ?";
    $check_stmt = $conn->prepare($check_sql);
    $check_stmt->bind_param("i", $id_int);
    $check_stmt->execute();
    $check_result = $check_stmt->get_result();
    if ($check_result->num_rows === 0) {
        http_response_code(404);
        echo json_encode(array("message" => "Silinecek işçi bulunamadı. ID: " . $id_int, "success" => false));
        $check_stmt->close();
        return;
    }
    $check_stmt->close();

    // Foreign key (teklif_kalemleri.isci_id) ON DELETE SET NULL olduğu için
    // işçi silindiğinde ilgili kalemlerde isci_id null olacak.
    // Ek bir kontrol veya uyarıya gerek yok, ancak loglanabilir.

    $sql = "DELETE FROM isciler WHERE id = ?";
    $stmt = $conn->prepare($sql);
    if ($stmt === false) {
        http_response_code(500);
        echo json_encode(array("message" => "SQL prepare error: " . $conn->error, "success" => false));
        return;
    }
    $stmt->bind_param("i", $id_int);

    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            http_response_code(200); // OK
            echo json_encode(array("message" => "İşçi başarıyla silindi.", "id" => $id_int, "success" => true));
        } else {
            // Bu durum yukarıdaki varlık kontrolü nedeniyle pek olası değil.
            http_response_code(404); 
            echo json_encode(array("message" => "Silinecek işçi bulunamadı (affect rows = 0).", "id" => $id_int, "success" => false));
        }
    } else {
        http_response_code(500);
        echo json_encode(array("message" => "İşçi silme hatası: " . $stmt->error, "success" => false));
    }
    $stmt->close();
}

?>