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
            getTeklif($conn, $id);
        } else {
            getTeklifler($conn);
        }
        break;
    case 'POST':
        addTeklif($conn);
        break;
    case 'PUT':
        if ($id) {
            updateTeklif($conn, $id);
        } else {
            http_response_code(400);
            echo json_encode(array("message" => "Güncellenecek teklif ID\'si belirtilmedi."));
        }
        break;
    case 'DELETE':
        if ($id) {
            deleteTeklif($conn, $id);
        } else {
            http_response_code(400);
            echo json_encode(array("message" => "Silinecek teklif ID\'si belirtilmedi."));
        }
        break;
    default:
        http_response_code(405);
        echo json_encode(array("message" => "Desteklenmeyen Metod: " . $method));
        break;
}

function getTeklifler($conn) {
    $sql = "SELECT t.*, m.adi as musteri_adi_tablodan 
            FROM teklifler t 
            LEFT JOIN musteriler m ON t.musteri_id = m.id 
            ORDER BY t.teklifTarihi DESC, t.teklifNo DESC";
    $result = $conn->query($sql);
    $teklifler = array();

    if ($result) {
        while($row = $result->fetch_assoc()) {
            // Her bir teklif için ürünleri (kalemleri) çek
            $urunler_sql = "SELECT * FROM teklif_urunleri WHERE teklif_id = ?";
            $stmt_urunler = $conn->prepare($urunler_sql);
            if ($stmt_urunler) {
                $stmt_urunler->bind_param("s", $row['id']);
                $stmt_urunler->execute();
                $urunler_result = $stmt_urunler->get_result();
                $row['urunler'] = array();
                while($urun_row = $urunler_result->fetch_assoc()) {
                    $row['urunler'][] = $urun_row;
                }
                $stmt_urunler->close();
            } else {
                 $row['urunler'] = array("error" => "Teklif ürünleri getirilirken SQL hazırlama hatası: " . $conn->error);
            }
            $teklifler[] = $row;
        }
        http_response_code(200);
    } else {
        http_response_code(500);
        $teklifler = array("message" => "Teklifler getirilirken SQL hatası oluştu.", "error" => $conn->error);
    }
    if (ob_get_level() > 0) { ob_end_clean(); }
    echo json_encode($teklifler);
}

function getTeklif($conn, $id) {
    $sql = "SELECT t.*, m.adi as musteri_adi_tablodan 
            FROM teklifler t 
            LEFT JOIN musteriler m ON t.musteri_id = m.id 
            WHERE t.id = ?";
    $stmt = $conn->prepare($sql);

    if ($stmt) {
        $stmt->bind_param("s", $id);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows > 0) {
            $teklif = $result->fetch_assoc();
            
            // Teklif ürünlerini çek
            $urunler_sql = "SELECT * FROM teklif_urunleri WHERE teklif_id = ?";
            $stmt_urunler = $conn->prepare($urunler_sql);
            if ($stmt_urunler) {
                $stmt_urunler->bind_param("s", $teklif['id']);
                $stmt_urunler->execute();
                $urunler_result = $stmt_urunler->get_result();
                $teklif['urunler'] = array();
                while($urun_row = $urunler_result->fetch_assoc()) {
                    $teklif['urunler'][] = $urun_row;
                }
                $stmt_urunler->close();
            } else {
                 $teklif['urunler'] = array("error" => "Teklif ürünleri getirilirken SQL hazırlama hatası: " . $conn->error);
            }
            http_response_code(200);
            echo json_encode($teklif);
        } else {
            http_response_code(404);
            echo json_encode(array("message" => "Teklif bulunamadı. ID: " . $id));
        }
        $stmt->close();
    } else {
        http_response_code(500);
        echo json_encode(array("message" => "Teklif getirilirken SQL hazırlama hatası oluştu.", "error" => $conn->error));
    }
    if (ob_get_level() > 0) { ob_end_clean(); }
}

function addTeklif($conn) {
    $data = json_decode(file_get_contents("php://input"));

    if (empty($data->id) || empty($data->teklifNo) || empty($data->teklifTarihi) || !isset($data->urunler) || !is_array($data->urunler)) {
        http_response_code(400);
        echo json_encode(array("message" => "Teklif eklemek için gerekli alanlar (id, teklifNo, teklifTarihi, urunler dizisi) eksik veya hatalı."));
        if (ob_get_level() > 0) { ob_end_clean(); }
        return;
    }

    $conn->begin_transaction();

    try {
        $id = $conn->real_escape_string(trim($data->id));
        $teklifNo = $conn->real_escape_string(trim($data->teklifNo));
        $musteri_id = isset($data->musteri_id) ? $conn->real_escape_string(trim($data->musteri_id)) : null;
        $musteriAdi = isset($data->musteriAdi) ? $conn->real_escape_string(trim($data->musteriAdi)) : null;
        $musteriIletisim = isset($data->musteriIletisim) ? $conn->real_escape_string(trim($data->musteriIletisim)) : null;
        $teklifTarihi = $conn->real_escape_string(trim($data->teklifTarihi));
        $gecerlilikTarihi = isset($data->gecerlilikTarihi) ? $conn->real_escape_string(trim($data->gecerlilikTarihi)) : null;
        $araToplam = isset($data->araToplam) ? floatval($data->araToplam) : 0.00;
        $indirimOrani = isset($data->indirimOrani) ? floatval($data->indirimOrani) : 0.00;
        $indirimTutari = isset($data->indirimTutari) ? floatval($data->indirimTutari) : 0.00;
        $kdvOrani = isset($data->kdvOrani) ? floatval($data->kdvOrani) : 0.00;
        $kdvTutari = isset($data->kdvTutari) ? floatval($data->kdvTutari) : 0.00;
        $genelToplam = isset($data->genelToplam) ? floatval($data->genelToplam) : 0.00;
        $paraBirimi = isset($data->paraBirimi) ? $conn->real_escape_string(trim($data->paraBirimi)) : 'TL';
        $durum = isset($data->durum) ? $conn->real_escape_string(trim($data->durum)) : 'Hazırlanıyor';
        $notlar = isset($data->notlar) ? $conn->real_escape_string(trim($data->notlar)) : null;

        // Teklif ID ve Teklif No benzersizlik kontrolü
        $checkSql = "SELECT id FROM teklifler WHERE id = ? OR teklifNo = ?";
        $stmt_check = $conn->prepare($checkSql);
        $stmt_check->bind_param("ss", $id, $teklifNo);
        $stmt_check->execute();
        if ($stmt_check->get_result()->num_rows > 0) {
            $stmt_check->close();
            throw new Exception("Bu ID (\'$id\') veya Teklif No (\'$teklifNo\') ile zaten bir teklif kayıtlı.", 409);
        }
        $stmt_check->close();

        $sql_teklif = "INSERT INTO teklifler (id, teklifNo, musteri_id, musteriAdi, musteriIletisim, teklifTarihi, gecerlilikTarihi, araToplam, indirimOrani, indirimTutari, kdvOrani, kdvTutari, genelToplam, paraBirimi, durum, notlar) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt_teklif = $conn->prepare($sql_teklif);
        $stmt_teklif->bind_param("ssssssddddddssss", $id, $teklifNo, $musteri_id, $musteriAdi, $musteriIletisim, $teklifTarihi, $gecerlilikTarihi, $araToplam, $indirimOrani, $indirimTutari, $kdvOrani, $kdvTutari, $genelToplam, $paraBirimi, $durum, $notlar);
        
        if (!$stmt_teklif->execute()) {
            throw new Exception("Ana teklif kaydedilirken SQL hatası: " . $stmt_teklif->error, 500);
        }
        $stmt_teklif->close();

        $sql_urun = "INSERT INTO teklif_urunleri (teklif_id, urun_id, malzemeAdi, miktar, birim, birimFiyat, satirToplami) VALUES (?, ?, ?, ?, ?, ?, ?)";
        $stmt_urun = $conn->prepare($sql_urun);

        foreach ($data->urunler as $urun) {
            if (empty($urun->malzemeAdi) || !isset($urun->miktar) || !isset($urun->birimFiyat) || !isset($urun->satirToplami)) {
                 throw new Exception("Teklif ürünü için gerekli alanlar (malzemeAdi, miktar, birimFiyat, satirToplami) eksik.", 400);
            }
            $urun_id_item = isset($urun->urunId) ? $conn->real_escape_string(trim($urun->urunId)) : (isset($urun->urun_id) ? $conn->real_escape_string(trim($urun->urun_id)) : null);
            $malzemeAdi_item = $conn->real_escape_string(trim($urun->malzemeAdi));
            $miktar_item = floatval($urun->miktar);
            $birim_item = isset($urun->birim) ? $conn->real_escape_string(trim($urun->birim)) : null;
            $birimFiyat_item = floatval($urun->birimFiyat);
            $satirToplami_item = floatval($urun->satirToplami);

            $stmt_urun->bind_param("sssdsdd", $id, $urun_id_item, $malzemeAdi_item, $miktar_item, $birim_item, $birimFiyat_item, $satirToplami_item);
            if (!$stmt_urun->execute()) {
                throw new Exception("Teklif ürünü kaydedilirken SQL hatası: " . $stmt_urun->error, 500);
            }
        }
        $stmt_urun->close();
        $conn->commit();
        http_response_code(201);
        // Kaydedilen teklifin tamamını (ürünleriyle) geri döndürmek daha iyi olabilir.
        // Bunun için getTeklif($conn, $id) fonksiyonunu burada çağırıp çıktısını verebilirsiniz.
        // Şimdilik basit bir mesaj dönüyoruz:
        echo json_encode(array("message" => "Teklif başarıyla eklendi.", "id" => $id, "teklifNo" => $teklifNo));

    } catch (Exception $e) {
        $conn->rollback();
        http_response_code($e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 500);
        echo json_encode(array("message" => $e->getMessage()));
    }
    if (ob_get_level() > 0) { ob_end_clean(); }
}


function updateTeklif($conn, $id_param) {
    $data = json_decode(file_get_contents("php://input"));
    $teklif_id_url = $conn->real_escape_string(trim($id_param)); // URL'den gelen ID

    if (empty($data->teklifNo) || empty($data->teklifTarihi) || !isset($data->urunler) || !is_array($data->urunler)) {
        http_response_code(400);
        echo json_encode(array("message" => "Teklif güncellemek için gerekli alanlar (teklifNo, teklifTarihi, urunler dizisi) eksik veya hatalı."));
        if (ob_get_level() > 0) { ob_end_clean(); }
        return;
    }
    
    // ID eşleşmesini kontrol et (URL'den gelen ID ile payload içindeki ID aynı olmalı)
    if (isset($data->id) && $conn->real_escape_string(trim($data->id)) !== $teklif_id_url) {
        http_response_code(400);
        echo json_encode(array("message" => "URL'deki teklif ID\'si ile istek gövdesindeki ID uyuşmuyor."));
        if (ob_get_level() > 0) { ob_end_clean(); }
        return;
    }

    $conn->begin_transaction();
    try {
        // Teklifin var olup olmadığını kontrol et
        $checkTeklifSql = "SELECT id FROM teklifler WHERE id = ?";
        $stmt_check_teklif = $conn->prepare($checkTeklifSql);
        $stmt_check_teklif->bind_param("s", $teklif_id_url);
        $stmt_check_teklif->execute();
        if ($stmt_check_teklif->get_result()->num_rows == 0) {
            $stmt_check_teklif->close();
            throw new Exception("Güncellenecek teklif bulunamadı. ID: " . $teklif_id_url, 404);
        }
        $stmt_check_teklif->close();

        // Teklif No benzersizlik kontrolü (kendisi hariç)
        $teklifNo = $conn->real_escape_string(trim($data->teklifNo));
        $checkNoSql = "SELECT id FROM teklifler WHERE teklifNo = ? AND id != ?";
        $stmt_check_no = $conn->prepare($checkNoSql);
        $stmt_check_no->bind_param("ss", $teklifNo, $teklif_id_url);
        $stmt_check_no->execute();
        if ($stmt_check_no->get_result()->num_rows > 0) {
            $stmt_check_no->close();
            throw new Exception("Bu Teklif No (\'$teklifNo\') başka bir teklife ait.", 409);
        }
        $stmt_check_no->close();
        
        // Ana teklif bilgilerini güncelle
        $musteri_id = isset($data->musteri_id) ? $conn->real_escape_string(trim($data->musteri_id)) : null;
        $musteriAdi = isset($data->musteriAdi) ? $conn->real_escape_string(trim($data->musteriAdi)) : null;
        $musteriIletisim = isset($data->musteriIletisim) ? $conn->real_escape_string(trim($data->musteriIletisim)) : null;
        $teklifTarihi = $conn->real_escape_string(trim($data->teklifTarihi));
        $gecerlilikTarihi = isset($data->gecerlilikTarihi) ? $conn->real_escape_string(trim($data->gecerlilikTarihi)) : null;
        $araToplam = isset($data->araToplam) ? floatval($data->araToplam) : 0.00;
        $indirimOrani = isset($data->indirimOrani) ? floatval($data->indirimOrani) : 0.00;
        $indirimTutari = isset($data->indirimTutari) ? floatval($data->indirimTutari) : 0.00;
        $kdvOrani = isset($data->kdvOrani) ? floatval($data->kdvOrani) : 0.00;
        $kdvTutari = isset($data->kdvTutari) ? floatval($data->kdvTutari) : 0.00;
        $genelToplam = isset($data->genelToplam) ? floatval($data->genelToplam) : 0.00;
        $paraBirimi = isset($data->paraBirimi) ? $conn->real_escape_string(trim($data->paraBirimi)) : 'TL';
        $durum = isset($data->durum) ? $conn->real_escape_string(trim($data->durum)) : 'Hazırlanıyor';
        $notlar = isset($data->notlar) ? $conn->real_escape_string(trim($data->notlar)) : null;

        $sql_update_teklif = "UPDATE teklifler SET teklifNo = ?, musteri_id = ?, musteriAdi = ?, musteriIletisim = ?, teklifTarihi = ?, gecerlilikTarihi = ?, araToplam = ?, indirimOrani = ?, indirimTutari = ?, kdvOrani = ?, kdvTutari = ?, genelToplam = ?, paraBirimi = ?, durum = ?, notlar = ? WHERE id = ?";
        $stmt_update_teklif = $conn->prepare($sql_update_teklif);
        $stmt_update_teklif->bind_param("ssssssddddddssss", $teklifNo, $musteri_id, $musteriAdi, $musteriIletisim, $teklifTarihi, $gecerlilikTarihi, $araToplam, $indirimOrani, $indirimTutari, $kdvOrani, $kdvTutari, $genelToplam, $paraBirimi, $durum, $notlar, $teklif_id_url);

        if (!$stmt_update_teklif->execute()) {
            throw new Exception("Ana teklif güncellenirken SQL hatası: " . $stmt_update_teklif->error, 500);
        }
        $stmt_update_teklif->close();

        // Mevcut ürünleri sil
        $sql_delete_urunler = "DELETE FROM teklif_urunleri WHERE teklif_id = ?";
        $stmt_delete_urunler = $conn->prepare($sql_delete_urunler);
        $stmt_delete_urunler->bind_param("s", $teklif_id_url);
        if (!$stmt_delete_urunler->execute()) {
             throw new Exception("Mevcut teklif ürünleri silinirken SQL hatası: " . $stmt_delete_urunler->error, 500);
        }
        $stmt_delete_urunler->close();

        // Yeni ürünleri ekle
        $sql_insert_urun = "INSERT INTO teklif_urunleri (teklif_id, urun_id, malzemeAdi, miktar, birim, birimFiyat, satirToplami) VALUES (?, ?, ?, ?, ?, ?, ?)";
        $stmt_insert_urun = $conn->prepare($sql_insert_urun);
        foreach ($data->urunler as $urun) {
            if (empty($urun->malzemeAdi) || !isset($urun->miktar) || !isset($urun->birimFiyat) || !isset($urun->satirToplami)) {
                 throw new Exception("Teklif ürünü için gerekli alanlar (malzemeAdi, miktar, birimFiyat, satirToplami) eksik.", 400);
            }
            $urun_id_item = isset($urun->urunId) ? $conn->real_escape_string(trim($urun->urunId)) : (isset($urun->urun_id) ? $conn->real_escape_string(trim($urun->urun_id)) : null);
            $malzemeAdi_item = $conn->real_escape_string(trim($urun->malzemeAdi));
            $miktar_item = floatval($urun->miktar);
            $birim_item = isset($urun->birim) ? $conn->real_escape_string(trim($urun->birim)) : null;
            $birimFiyat_item = floatval($urun->birimFiyat);
            $satirToplami_item = floatval($urun->satirToplami);

            $stmt_insert_urun->bind_param("sssdsdd", $teklif_id_url, $urun_id_item, $malzemeAdi_item, $miktar_item, $birim_item, $birimFiyat_item, $satirToplami_item);
            if (!$stmt_insert_urun->execute()) {
                throw new Exception("Yeni teklif ürünü kaydedilirken SQL hatası: " . $stmt_insert_urun->error, 500);
            }
        }
        $stmt_insert_urun->close();

        $conn->commit();
        http_response_code(200);
        // Güncellenen teklifi (ürünleriyle birlikte) geri döndürmek iyi bir pratik olacaktır.
        // getTeklif($conn, $teklif_id_url) çağrılabilir. Şimdilik basit mesaj:
        echo json_encode(array("message" => "Teklif başarıyla güncellendi.", "id" => $teklif_id_url));

    } catch (Exception $e) {
        $conn->rollback();
        http_response_code($e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 500);
        echo json_encode(array("message" => $e->getMessage()));
    }
    if (ob_get_level() > 0) { ob_end_clean(); }
}

function deleteTeklif($conn, $id_param) {
    $id = $conn->real_escape_string(trim($id_param));
    // Teklif silindiğinde, teklif_urunleri tablosundaki ilişkili kayıtlar
    // FOREIGN KEY tanımındaki ON DELETE CASCADE sayesinde otomatik silinecektir.

    // Teklifin var olup olmadığını kontrol et
    $checkSql = "SELECT id FROM teklifler WHERE id = ?";
    $stmt_check = $conn->prepare($checkSql);
    $stmt_check->bind_param("s", $id);
    $stmt_check->execute();
    $result_check = $stmt_check->get_result();
    if ($result_check->num_rows == 0) {
        $stmt_check->close();
        http_response_code(404);
        echo json_encode(array("message" => "Silinecek teklif bulunamadı. ID: " . $id));
        if (ob_get_level() > 0) { ob_end_clean(); }
        return;
    }
    $stmt_check->close();

    $sql = "DELETE FROM teklifler WHERE id = ?";
    $stmt = $conn->prepare($sql);
    if ($stmt) {
        $stmt->bind_param("s", $id);
        if ($stmt->execute()) {
            if ($stmt->affected_rows > 0) {
                http_response_code(200); // Veya 204 No Content
                echo json_encode(array("message" => "Teklif başarıyla silindi."));
            } else {
                // Normalde checkSql nedeniyle buraya düşmemeli
                http_response_code(404); 
                echo json_encode(array("message" => "Silinecek teklif bulunamadı (veya zaten silinmişti)."));
            }
        } else {
            http_response_code(500);
            echo json_encode(array("message" => "Teklif silinirken SQL hatası oluştu.", "error" => $stmt->error));
        }
        $stmt->close();
    } else {
        http_response_code(500);
        echo json_encode(array("message" => "Teklif silinirken SQL hazırlama hatası oluştu.", "error" => $conn->error));
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