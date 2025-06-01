<?php
// Çıktı tamponlamasını başlat ve mevcut çıktıları temizle
ob_start();
if (ob_get_level() > 0) {
    ob_clean();
}

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Veritabanı bağlantısı
// db_config.php dosyasının doğru yolda olduğundan emin olun
// Bu dosya genellikle $conn = new mysqli(DB_SERVER, DB_USERNAME, DB_PASSWORD, DB_NAME); gibi bir bağlantı içerir
// ve karakter setini mysqli_set_charset($conn, "utf8mb4"); ile ayarlar.
require_once '../config/db_config.php'; 

$method = $_SERVER['REQUEST_METHOD'];
// ID string olabileceği için real_escape_string uyguluyoruz.
$id = isset($_GET['id']) ? $conn->real_escape_string(trim($_GET['id'])) : null;

// CORS Başlıkları
header("Access-Control-Allow-Origin: *"); // Geliştirme için *, canlı ortamda kendi domaininizle değiştirin
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// OPTIONS isteği için (pre-flight)
if ($method == 'OPTIONS') {
    http_response_code(200);
    if (ob_get_level() > 0) {
        ob_end_clean();
    }
    exit();
}

switch ($method) {
    case 'GET':
        if ($id) {
            getMusteri($conn, $id);
        } else {
            getMusteriler($conn);
        }
        break;
    case 'POST':
        addMusteri($conn);
        break;
    case 'PUT':
        if ($id) {
            updateMusteri($conn, $id);
        } else {
            http_response_code(400); // Bad Request
            echo json_encode(array("message" => "Güncellenecek müşteri ID\'si belirtilmedi."));
        }
        break;
    case 'DELETE':
        if ($id) {
            deleteMusteri($conn, $id);
        } else {
            http_response_code(400); // Bad Request
            echo json_encode(array("message" => "Silinecek müşteri ID\'si belirtilmedi."));
        }
        break;
    default:
        http_response_code(405); // Method Not Allowed
        echo json_encode(array("message" => "Desteklenmeyen Metod: " . $method));
        break;
}

function getMusteriler($conn) {
    $sql = "SELECT id, adi, yetkiliKisi, telefon, email, adres, vergiNo, notlar FROM musteriler ORDER BY adi ASC";
    $result = $conn->query($sql);
    $musteriler = array();
    if ($result) {
        while($row = $result->fetch_assoc()) {
            $musteriler[] = $row;
        }
        http_response_code(200); // OK
    } else {
        http_response_code(500); // Internal Server Error
        $musteriler = array("message" => "Müşteriler getirilirken SQL hatası oluştu.", "error" => $conn->error);
    }
    if (ob_get_level() > 0) {
        ob_end_clean();
    }
    echo json_encode($musteriler);
}

function getMusteri($conn, $id) {
    $sql = "SELECT id, adi, yetkiliKisi, telefon, email, adres, vergiNo, notlar FROM musteriler WHERE id = ?";
    $stmt = $conn->prepare($sql);
    if ($stmt) {
        $stmt->bind_param("s", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        if ($result->num_rows > 0) {
            $musteri = $result->fetch_assoc();
            http_response_code(200); // OK
            echo json_encode($musteri);
        } else {
            http_response_code(404); // Not Found
            echo json_encode(array("message" => "Müşteri bulunamadı. ID: " . $id));
        }
        $stmt->close();
    } else {
        http_response_code(500); // Internal Server Error
        echo json_encode(array("message" => "Müşteri getirilirken SQL hazırlama hatası oluştu.", "error" => $conn->error));
    }
    if (ob_get_level() > 0) {
        ob_end_clean();
    }
}

function addMusteri($conn) {
    $data = json_decode(file_get_contents("php://input"));

    // Gerekli alan kontrolü (sadece adi zorunlu)
    if (empty($data->adi)) {
        http_response_code(400); // Bad Request
        echo json_encode(array("message" => "Müşteri eklemek için 'adi' alanı zorunludur."));
        if (ob_get_level() > 0) {
            ob_end_clean();
        }
        return;
    }

    // Veri temizleme ve atama
    $id = isset($data->id) && !empty(trim($data->id)) ? $conn->real_escape_string(trim($data->id)) : null;
    $adi = $conn->real_escape_string(trim($data->adi));
    $yetkiliKisi = isset($data->yetkiliKisi) ? $conn->real_escape_string(trim($data->yetkiliKisi)) : null;
    $telefon = isset($data->telefon) ? $conn->real_escape_string(trim($data->telefon)) : null;
    $email = isset($data->email) ? $conn->real_escape_string(trim($data->email)) : null;
    $adres = isset($data->adres) ? $conn->real_escape_string(trim($data->adres)) : null;
    $vergiNo = isset($data->vergiNo) ? $conn->real_escape_string(trim($data->vergiNo)) : null;
    $notlar = isset($data->notlar) ? $conn->real_escape_string(trim($data->notlar)) : null;

    if ($id) {
        // ID verilmişse, benzersiz olup olmadığını kontrol et
        $checkSql = "SELECT id FROM musteriler WHERE id = ?";
        $stmt_check = $conn->prepare($checkSql);
        if (!$stmt_check) {
            http_response_code(500);
            echo json_encode(array("message" => "ID kontrolü SQL hazırlama hatası.", "error" => $conn->error));
            if (ob_get_level() > 0) { ob_end_clean(); }
            return;
        }
        $stmt_check->bind_param("s", $id);
        $stmt_check->execute();
        $result_check = $stmt_check->get_result();
        if ($result_check->num_rows > 0) {
            http_response_code(409); // Conflict
            echo json_encode(array("message" => "Bu ID ('$id') ile zaten bir müşteri kayıtlı."));
            $stmt_check->close();
            if (ob_get_level() > 0) { ob_end_clean(); }
            return;
        }
        $stmt_check->close();
        
        $sql = "INSERT INTO musteriler (id, adi, yetkiliKisi, telefon, email, adres, vergiNo, notlar) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($sql);
        $bind_types = "ssssssss";
        $bind_params = array(&$bind_types, &$id, &$adi, &$yetkiliKisi, &$telefon, &$email, &$adres, &$vergiNo, &$notlar);

    } else {
        // ID verilmemişse, ID olmadan ekle (veritabanı otomatik ID atayacak varsayımı)
        $sql = "INSERT INTO musteriler (adi, yetkiliKisi, telefon, email, adres, vergiNo, notlar) VALUES (?, ?, ?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($sql);
        $bind_types = "sssssss";
        $bind_params = array(&$bind_types, &$adi, &$yetkiliKisi, &$telefon, &$email, &$adres, &$vergiNo, &$notlar);
    }

    if ($stmt) {
        // call_user_func_array ile bind_param çağrısı
        call_user_func_array(array($stmt, 'bind_param'), $bind_params);

        if ($stmt->execute()) {
            $inserted_id = $id ? $id : $conn->insert_id; // Eğer ID biz verdiysek onu, değilse veritabanının atadığı ID'yi al
            http_response_code(201); // Created
            echo json_encode(array(
                "message" => "Müşteri başarıyla eklendi.", 
                "data" => array(
                    "id" => $inserted_id,
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
            http_response_code(500); // Internal Server Error
            echo json_encode(array("message" => "Müşteri eklenirken SQL hatası oluştu.", "error" => $stmt->error));
        }
        $stmt->close();
    } else {
        http_response_code(500); // Internal Server Error
        echo json_encode(array("message" => "Müşteri eklenirken SQL hazırlama hatası oluştu.", "error" => $conn->error));
    }
    if (ob_get_level() > 0) {
        ob_end_clean();
    }
}

function updateMusteri($conn, $id_param) {
    $data = json_decode(file_get_contents("php://input"));

    // Gerekli alan kontrolü (en azından bir alan güncellenmeli, genelde \'ad\' zorunlu tutulur)
    if (empty($data->adi)) { 
        http_response_code(400); // Bad Request
        echo json_encode(array("message" => "Müşteri güncellemek için \'adi\' alanı gereklidir."));
        if (ob_get_level() > 0) {
            ob_end_clean();
        }
        return;
    }

    $id = $conn->real_escape_string(trim($id_param)); // URL\'den gelen ID

    // Müşterinin var olup olmadığını kontrol et
    $checkSql = "SELECT id FROM musteriler WHERE id = ?";
    $stmt_check = $conn->prepare($checkSql);
    if (!$stmt_check) {
        http_response_code(500);
        echo json_encode(array("message" => "Müşteri varlık kontrolü SQL hazırlama hatası.", "error" => $conn->error));
        if (ob_get_level() > 0) { ob_end_clean(); }
        return;
    }
    $stmt_check->bind_param("s", $id);
    $stmt_check->execute();
    $result_check = $stmt_check->get_result();

    if ($result_check->num_rows == 0) {
        http_response_code(404); // Not Found
        echo json_encode(array("message" => "Güncellenecek müşteri bulunamadı. ID: " . $id));
        $stmt_check->close();
        if (ob_get_level() > 0) { ob_end_clean(); }
        return;
    }
    $stmt_check->close();

    // Veri temizleme ve atama
    $adi = $conn->real_escape_string(trim($data->adi));
    $yetkiliKisi = isset($data->yetkiliKisi) ? $conn->real_escape_string(trim($data->yetkiliKisi)) : null;
    $telefon = isset($data->telefon) ? $conn->real_escape_string(trim($data->telefon)) : null;
    $email = isset($data->email) ? $conn->real_escape_string(trim($data->email)) : null;
    $adres = isset($data->adres) ? $conn->real_escape_string(trim($data->adres)) : null;
    $vergiNo = isset($data->vergiNo) ? $conn->real_escape_string(trim($data->vergiNo)) : null;
    $notlar = isset($data->notlar) ? $conn->real_escape_string(trim($data->notlar)) : null;

    $sql = "UPDATE musteriler SET adi = ?, yetkiliKisi = ?, telefon = ?, email = ?, adres = ?, vergiNo = ?, notlar = ? WHERE id = ?";
    $stmt = $conn->prepare($sql);

    if ($stmt) {
        $stmt->bind_param("ssssssss", $adi, $yetkiliKisi, $telefon, $email, $adres, $vergiNo, $notlar, $id);
        if ($stmt->execute()) {
            if ($stmt->affected_rows > 0) {
                http_response_code(200); // OK
                 echo json_encode(array(
                    "message" => "Müşteri başarıyla güncellendi.",
                    "data" => array( // Güncellenmiş veriyi geri döndürmek iyi bir pratik
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
                http_response_code(200); // OK ama değişiklik olmadı (örneğin aynı veri gönderildi)
                echo json_encode(array("message" => "Müşteri bilgileri güncellendi ancak gönderilen veriler mevcut verilerle aynıydı."));
            }
        } else {
            http_response_code(500); // Internal Server Error
            echo json_encode(array("message" => "Müşteri güncellenirken SQL hatası oluştu.", "error" => $stmt->error));
        }
        $stmt->close();
    } else {
        http_response_code(500); // Internal Server Error
        echo json_encode(array("message" => "Müşteri güncellenirken SQL hazırlama hatası oluştu.", "error" => $conn->error));
    }
    if (ob_get_level() > 0) {
        ob_end_clean();
    }
}

function deleteMusteri($conn, $id_param) {
    $id = $conn->real_escape_string(trim($id_param));

    // Müşterinin var olup olmadığını kontrol et
    $checkSql = "SELECT id FROM musteriler WHERE id = ?";
    $stmt_check = $conn->prepare($checkSql);
     if (!$stmt_check) {
        http_response_code(500);
        echo json_encode(array("message" => "Müşteri varlık kontrolü SQL hazırlama hatası.", "error" => $conn->error));
        if (ob_get_level() > 0) { ob_end_clean(); }
        return;
    }
    $stmt_check->bind_param("s", $id);
    $stmt_check->execute();
    $result_check = $stmt_check->get_result();

    if ($result_check->num_rows == 0) {
        http_response_code(404); // Not Found
        echo json_encode(array("message" => "Silinecek müşteri bulunamadı. ID: " . $id));
        $stmt_check->close();
        if (ob_get_level() > 0) { ob_end_clean(); }
        return;
    }
    $stmt_check->close();

    // İPUCU: Müşteri silinmeden önce ilişkili kayıtlar varsa (örneğin teklifler)
    // bu kayıtların ne yapılacağına karar vermelisiniz (silmek, null yapmak, engellemek vb.).
    // Örneğin:
    // $deleteTekliflerSql = "DELETE FROM teklifler WHERE musteri_id = ?";
    // $stmtTeklif = $conn->prepare($deleteTekliflerSql);
    // $stmtTeklif->bind_param("s", $id);
    // $stmtTeklif->execute();
    // $stmtTeklif->close();
    // Bu kısım projenizin iş mantığına göre detaylandırılmalıdır.

    $sql = "DELETE FROM musteriler WHERE id = ?";
    $stmt = $conn->prepare($sql);

    if ($stmt) {
        $stmt->bind_param("s", $id);
        if ($stmt->execute()) {
            if ($stmt->affected_rows > 0) {
                http_response_code(200); // OK
                // Bazı API\'ler 204 No Content döner, bu da bir seçenek.
                // http_response_code(204); 
                echo json_encode(array("message" => "Müşteri başarıyla silindi."));
            } else {
                // Bu durum normalde checkSql nedeniyle oluşmamalı ama yine de bir kontrol.
                http_response_code(404); 
                echo json_encode(array("message" => "Silinecek müşteri bulunamadı (veya zaten silinmişti)."));
            }
        } else {
            http_response_code(500); // Internal Server Error
            echo json_encode(array("message" => "Müşteri silinirken SQL hatası oluştu.", "error" => $stmt->error));
        }
        $stmt->close();
    } else {
        http_response_code(500); // Internal Server Error
        echo json_encode(array("message" => "Müşteri silinirken SQL hazırlama hatası oluştu.", "error" => $conn->error));
    }
    if (ob_get_level() > 0) {
        ob_end_clean();
    }
}

if (isset($conn)) {
    $conn->close();
}

// En sonda kalan tüm çıktıları temizle (güvenlik önlemi)
if (ob_get_level() > 0) {
    ob_end_flush(); // veya ob_end_clean(); eğer hiçbir çıktı gönderilmeyeceğinden eminseniz.
}
?> 