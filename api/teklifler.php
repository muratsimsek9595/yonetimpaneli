<?php
header("Content-Type: application/json; charset=UTF-8");

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once '../config/db_config.php';

if ($conn === null || $conn->connect_error) {
    http_response_code(503);
    echo json_encode(array("message" => "Veritabanı bağlantısı kurulamadı.", "error" => ($conn ? $conn->connect_error : "Bağlantı nesnesi null.")));
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];
$id_url = isset($_GET['id']) ? trim($_GET['id']) : null; // String ID, intval yok

// CORS Başlıkları
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($method == 'OPTIONS') {
    http_response_code(200);
    exit();
}

switch ($method) {
    case 'GET':
        if ($id_url) {
            getTeklif($conn, $id_url);
        } else {
            getTeklifler($conn);
        }
        break;
    case 'POST':
        addTeklif($conn);
        break;
    case 'PUT':
        if ($id_url) {
            updateTeklif($conn, $id_url);
        } else {
            http_response_code(400);
            echo json_encode(array("message" => "Güncellenecek teklif ID'si belirtilmedi."));
        }
        break;
    case 'DELETE':
        if ($id_url) {
            deleteTeklif($conn, $id_url);
        } else {
            http_response_code(400);
            echo json_encode(array("message" => "Silinecek teklif ID'si belirtilmedi."));
        }
        break;
    default:
        http_response_code(405);
        echo json_encode(array("message" => "Desteklenmeyen Metod: " . $method));
        break;
}

function getTeklifler($conn) {
    $sql = "SELECT t.*, m.ad as musteriAdi 
            FROM teklifler t 
            LEFT JOIN musteriler m ON t.musteri_id = m.id 
            ORDER BY t.teklifTarihi DESC, t.id DESC"; // id'ye göre sıralama daha tutarlı olabilir teklifNo yerine
    $result = $conn->query($sql);
    $teklifler = array();

    if ($result) {
        while($row = $result->fetch_assoc()) {
            $urunler_sql = "SELECT * FROM teklif_urunleri WHERE teklif_id = ?";
            $stmt_urunler = $conn->prepare($urunler_sql);
            if ($stmt_urunler) {
                $stmt_urunler->bind_param("s", $row['id']); // teklifler.id VARCHAR(64)
                $stmt_urunler->execute();
                $urunler_result = $stmt_urunler->get_result();
                $row['urunler'] = array();
                while($urun_row = $urunler_result->fetch_assoc()) {
                    $row['urunler'][] = $urun_row;
                }
                $stmt_urunler->close();
            } else {
                 $row['urunler'] = array("error_detail" => "Teklif ürünleri SQL hazırlama hatası: " . $conn->error);
            }
            $teklifler[] = $row;
        }
        http_response_code(200);
        echo json_encode($teklifler);
    } else {
        http_response_code(500);
        echo json_encode(array("message" => "Teklifler getirilirken SQL hatası oluştu.", "error_detail" => $conn->error));
    }
}

function getTeklif($conn, $id) {
    $id_escaped = $conn->real_escape_string($id);
    $sql = "SELECT t.*, m.ad as musteriAdi 
            FROM teklifler t 
            LEFT JOIN musteriler m ON t.musteri_id = m.id 
            WHERE t.id = ?";
    $stmt = $conn->prepare($sql);

    if ($stmt) {
        $stmt->bind_param("s", $id_escaped); // teklifler.id VARCHAR(64)
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows > 0) {
            $teklif = $result->fetch_assoc();
            $urunler_sql = "SELECT * FROM teklif_urunleri WHERE teklif_id = ?";
            $stmt_urunler = $conn->prepare($urunler_sql);
            if ($stmt_urunler) {
                $stmt_urunler->bind_param("s", $teklif['id']); // teklifler.id VARCHAR(64)
                $stmt_urunler->execute();
                $urunler_result = $stmt_urunler->get_result();
                $teklif['urunler'] = array();
                while($urun_row = $urunler_result->fetch_assoc()) {
                    $teklif['urunler'][] = $urun_row;
                }
                $stmt_urunler->close();
            } else {
                 $teklif['urunler'] = array("error_detail" => "Teklif ürünleri SQL hazırlama hatası: " . $conn->error);
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
        echo json_encode(array("message" => "Teklif getirilirken SQL hazırlama hatası oluştu.", "error_detail" => $conn->error));
    }
}

function addTeklif($conn) {
    $data = json_decode(file_get_contents("php://input"));

    if (!isset($data->teklifNo, $data->teklifTarihi, $data->urunler) || !is_array($data->urunler)) {
        http_response_code(400);
        echo json_encode(array("message" => "Teklif eklemek için gerekli alanlar (teklifNo, teklifTarihi, urunler dizisi) eksik veya hatalı. ID sunucu tarafında üretilecek."));
        return;
    }

    $conn->begin_transaction();

    $id = uniqid('teklif_', true); // Benzersiz ID sunucuda üretiliyor
    $teklifNo = $conn->real_escape_string(trim($data->teklifNo));
    $musteri_id = isset($data->musteri_id) && !empty(trim($data->musteri_id)) ? intval(trim($data->musteri_id)) : null;
    $musteriAdi = isset($data->musteriAdi) ? $conn->real_escape_string(trim($data->musteriAdi)) : null;
    $musteriIletisim = isset($data->musteriIletisim) ? $conn->real_escape_string(trim($data->musteriIletisim)) : null;
    $projeAdi = isset($data->projeAdi) ? $conn->real_escape_string(trim($data->projeAdi)) : null;
    $teklifTarihi = $conn->real_escape_string(trim($data->teklifTarihi));
    $gecerlilikTarihi = isset($data->gecerlilikTarihi) ? $conn->real_escape_string(trim($data->gecerlilikTarihi)) : null;
    $hazirlayan = isset($data->hazirlayan) ? $conn->real_escape_string(trim($data->hazirlayan)) : null;
    $paraBirimi = isset($data->paraBirimi) ? $conn->real_escape_string(trim($data->paraBirimi)) : 'TL';
    $araToplamMaliyet = isset($data->araToplamMaliyet) ? floatval($data->araToplamMaliyet) : 0.00;
    $araToplamSatis = isset($data->araToplamSatis) ? floatval($data->araToplamSatis) : 0.00;
    $indirimOrani = isset($data->indirimOrani) ? floatval($data->indirimOrani) : 0.00;
    $indirimTutari = isset($data->indirimTutari) ? floatval($data->indirimTutari) : 0.00;
    $kdvOrani = isset($data->kdvOrani) ? floatval($data->kdvOrani) : 0.00;
    $kdvTutari = isset($data->kdvTutari) ? floatval($data->kdvTutari) : 0.00;
    $genelToplamSatis = isset($data->genelToplamSatis) ? floatval($data->genelToplamSatis) : 0.00;
    $durum = isset($data->durum) ? $conn->real_escape_string(trim($data->durum)) : 'Hazırlanıyor';
    $notlar = isset($data->notlar) ? $conn->real_escape_string(trim($data->notlar)) : null;

    $checkSqlNo = "SELECT id FROM teklifler WHERE teklifNo = ?";
    $stmt_check_no = $conn->prepare($checkSqlNo);
    if (!$stmt_check_no) {
        http_response_code(500);
        echo json_encode(array("message" => "Teklif No kontrol sorgusu hazırlanamadı.", "error_detail" => $conn->error));
        $conn->rollback();
        return;
    }
    $stmt_check_no->bind_param("s", $teklifNo);
    $stmt_check_no->execute();
    if ($stmt_check_no->get_result()->num_rows > 0) {
        $stmt_check_no->close();
        http_response_code(409);
        echo json_encode(array("message" => "Bu Teklif No ('$teklifNo') ile zaten bir teklif kayıtlı."));
        $conn->rollback();
        return;
    }
    $stmt_check_no->close();

    $sql_teklif = "INSERT INTO teklifler (id, teklifNo, musteri_id, musteriAdi, musteriIletisim, projeAdi, teklifTarihi, gecerlilikTarihi, hazirlayan, paraBirimi, araToplamMaliyet, araToplamSatis, indirimOrani, indirimTutari, kdvOrani, kdvTutari, genelToplamSatis, durum, notlar, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())";
    $stmt_teklif = $conn->prepare($sql_teklif);
    if (!$stmt_teklif) {
        http_response_code(500);
        echo json_encode(array("message" => "Ana teklif ekleme sorgusu hazırlanamadı.", "error_detail" => $conn->error));
        $conn->rollback();
        return;
    }
    // Tipler: id(s), teklifNo(s), musteri_id(i), musteriAdi(s), musteriIletisim(s), projeAdi(s), teklifTarihi(s), gecerlilikTarihi(s), hazirlayan(s), paraBirimi(s), araToplamMaliyet(d), araToplamSatis(d), indirimOrani(d), indirimTutari(d), kdvOrani(d), kdvTutari(d), genelToplamSatis(d), durum(s), notlar(s)
    $stmt_teklif->bind_param("ssissssssdddddddsss", $id, $teklifNo, $musteri_id, $musteriAdi, $musteriIletisim, $projeAdi, $teklifTarihi, $gecerlilikTarihi, $hazirlayan, $paraBirimi, $araToplamMaliyet, $araToplamSatis, $indirimOrani, $indirimTutari, $kdvOrani, $kdvTutari, $genelToplamSatis, $durum, $notlar);
    
    if (!$stmt_teklif->execute()) {
        http_response_code(500);
        echo json_encode(array("message" => "Ana teklif kaydedilirken SQL hatası.", "error_detail" => $stmt_teklif->error));
        $conn->rollback();
        $stmt_teklif->close();
        return;
    }
    $stmt_teklif->close();

    $sql_urun = "INSERT INTO teklif_urunleri (teklif_id, kalemTipi, referans_id, aciklama, miktar, birim, kaydedilen_birim_maliyet, kaydedilen_birim_satis_fiyati, kdv_orani_kalem, satir_toplam_maliyet, satir_toplam_satis_fiyati_kdv_haric, satir_kdv_tutari, satir_toplam_satis_fiyati_kdv_dahil, siraNo, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())";
    $stmt_urun = $conn->prepare($sql_urun);
    if (!$stmt_urun) {
        http_response_code(500);
        echo json_encode(array("message" => "Teklif ürünü ekleme sorgusu hazırlanamadı.", "error_detail" => $conn->error));
        $conn->rollback();
        return;
    }

    foreach ($data->urunler as $key => $urun) {
        if (!isset($urun->kalemTipi, $urun->aciklama, $urun->miktar, $urun->birim, $urun->kaydedilen_birim_satis_fiyati)) {
             http_response_code(400);
             echo json_encode(array("message" => "Teklif ürünü için gerekli alanlar eksik (kalemTipi, aciklama, miktar, birim, kaydedilen_birim_satis_fiyati). Ürün: " . json_encode($urun)));
             $conn->rollback();
             $stmt_urun->close();
             return;
        }
        $kalemTipi = $conn->real_escape_string(trim($urun->kalemTipi));
        $referans_id = isset($urun->urunId) ? $conn->real_escape_string(trim($urun->urunId)) : (isset($urun->referans_id) ? $conn->real_escape_string(trim($urun->referans_id)) : null);
        $aciklama = $conn->real_escape_string(trim($urun->aciklama));
        $miktar = floatval($urun->miktar);
        $birim = $conn->real_escape_string(trim($urun->birim));
        $kaydedilen_birim_maliyet = isset($urun->kaydedilen_birim_maliyet) ? floatval($urun->kaydedilen_birim_maliyet) : 0.00;
        $kaydedilen_birim_satis_fiyati = floatval($urun->kaydedilen_birim_satis_fiyati);
        $kdv_orani_kalem = isset($urun->kdv_orani_kalem) ? floatval($urun->kdv_orani_kalem) : $kdvOrani; // Ana KDV veya kaleme özel
        $satir_toplam_maliyet = $miktar * $kaydedilen_birim_maliyet;
        $satir_toplam_satis_fiyati_kdv_haric = $miktar * $kaydedilen_birim_satis_fiyati;
        $satir_kdv_tutari = $satir_toplam_satis_fiyati_kdv_haric * ($kdv_orani_kalem / 100);
        $satir_toplam_satis_fiyati_kdv_dahil = $satir_toplam_satis_fiyati_kdv_haric + $satir_kdv_tutari;
        $siraNo = isset($urun->siraNo) ? intval($urun->siraNo) : ($key + 1);

        // Tipler: teklif_id(s), kalemTipi(s), referans_id(s), aciklama(s), miktar(d), birim(s), kaydedilen_birim_maliyet(d), kaydedilen_birim_satis_fiyati(d), kdv_orani_kalem(d), satir_toplam_maliyet(d), satir_toplam_satis_fiyati_kdv_haric(d), satir_kdv_tutari(d), satir_toplam_satis_fiyati_kdv_dahil(d), siraNo(i)
        $stmt_urun->bind_param("ssssdsdddddddi", $id, $kalemTipi, $referans_id, $aciklama, $miktar, $birim, $kaydedilen_birim_maliyet, $kaydedilen_birim_satis_fiyati, $kdv_orani_kalem, $satir_toplam_maliyet, $satir_toplam_satis_fiyati_kdv_haric, $satir_kdv_tutari, $satir_toplam_satis_fiyati_kdv_dahil, $siraNo);
        if (!$stmt_urun->execute()) {
            http_response_code(500);
            echo json_encode(array("message" => "Teklif ürünü kaydedilirken SQL hatası.", "error_detail" => $stmt_urun->error, "urun_data" => $urun));
            $conn->rollback();
            $stmt_urun->close();
            return;
        }
    }
    $stmt_urun->close();
    $conn->commit();
    http_response_code(201);

    // Frontend'e gönderilecek tam teklif verisini oluştur
    $returnData = $data; // JavaScript'ten gelen tüm verileri al
    $returnData->id = $id; // Sunucuda üretilen yeni ID'yi ekle
    // Eğer musteri_id null ise ve $data->musteri_id yoksa, bunu da ekleyebiliriz
    if (!isset($returnData->musteri_id) && $musteri_id === null) {
        $returnData->musteri_id = null;
    }
    // Frontend'in beklediği diğer alanlar zaten $data içinde olmalı
    // (araToplamSatis, genelToplamSatis vb. $data içinde araToplam, genelToplam olarak geliyor olabilir, JS tarafıyla isimlerin tutarlı olması önemli)
    // JavaScript'in gönderdiği isimlerle (örn: $data->genelToplam) eşleştiğinden emin olalım.
    // Eğer $data içinde bu toplamlar farklı isimlerdeyse (örn: araToplamSatis yerine araToplam) 
    // $returnData altında doğru isimlerle atama yapmak gerekebilir.
    // Ancak mevcut PHP kodunda zaten $data->araToplamSatis gibi doğrudan okuma yapılıyor, 
    // bu da JS'in bu isimlerle gönderdiği anlamına gelir.

    echo json_encode(array(
        "message" => "Teklif başarıyla eklendi.", 
        "data" => $returnData 
    ));
}


function updateTeklif($conn, $id_url_param) {
    $data = json_decode(file_get_contents("php://input"));
    $id_to_update = $conn->real_escape_string(trim($id_url_param));

    if (empty($data)) {
        http_response_code(400);
        echo json_encode(array("message" => "Güncelleme için veri bulunamadı."));
        return;
    }

    // ID payload içinde geliyorsa URL ile eşleşmeli (isteğe bağlı, UUID'ler genellikle payload'da olmaz)
    if (isset($data->id) && $conn->real_escape_string(trim($data->id)) !== $id_to_update) {
        http_response_code(400);
        echo json_encode(array("message" => "URL'deki teklif ID'si ile istek gövdesindeki ID uyuşmuyor."));
        return;
    }
    
    $conn->begin_transaction();

    // Teklifin var olup olmadığını kontrol et
    $check_exists_sql = "SELECT id, kdvOrani FROM teklifler WHERE id = ?"; // Mevcut KDV oranını da alalım
    $stmt_check_exists = $conn->prepare($check_exists_sql);
    if (!$stmt_check_exists) {
        http_response_code(500);
        echo json_encode(array("message" => "Teklif varlık kontrol sorgusu hazırlanamadı.", "error_detail" => $conn->error));
        $conn->rollback();
        return;
    }
    $stmt_check_exists->bind_param("s", $id_to_update);
    $stmt_check_exists->execute();
    $check_result = $stmt_check_exists->get_result();
    if ($check_result->num_rows === 0) {
        $stmt_check_exists->close();
        http_response_code(404);
        echo json_encode(array("message" => "Güncellenecek teklif bulunamadı. ID: " . $id_to_update));
        $conn->rollback();
        return;
    }
    $existingTeklif = $check_result->fetch_assoc();
    $stmt_check_exists->close();
    
    // Teklif No benzersizlik kontrolü (kendisi hariç)
    if (isset($data->teklifNo)) {
        $newTeklifNo = $conn->real_escape_string(trim($data->teklifNo));
        $checkSqlNo = "SELECT id FROM teklifler WHERE teklifNo = ? AND id != ?";
        $stmt_check_no = $conn->prepare($checkSqlNo);
        if (!$stmt_check_no) {
            http_response_code(500);
            echo json_encode(array("message" => "Güncelleme için Teklif No kontrol sorgusu hazırlanamadı.", "error_detail" => $conn->error));
            $conn->rollback();
            return;
        }
        $stmt_check_no->bind_param("ss", $newTeklifNo, $id_to_update);
        $stmt_check_no->execute();
        if ($stmt_check_no->get_result()->num_rows > 0) {
            $stmt_check_no->close();
            http_response_code(409);
            echo json_encode(array("message" => "Başka bir teklif zaten bu Teklif No ('$newTeklifNo') ile kayıtlı."));
            $conn->rollback();
            return;
        }
        $stmt_check_no->close();
    }

    $fields = [];
    $params = [];
    $types = "";

    // Güncellenecek alanları dinamik olarak oluştur
    if (isset($data->teklifNo)) { $fields[] = "teklifNo = ?"; $params[] = $conn->real_escape_string(trim($data->teklifNo)); $types .= "s"; }
    if (isset($data->musteri_id)) { $fields[] = "musteri_id = ?"; $params[] = (empty(trim($data->musteri_id))) ? null : intval(trim($data->musteri_id)); $types .= "i"; }
    if (isset($data->musteriAdi)) { $fields[] = "musteriAdi = ?"; $params[] = $conn->real_escape_string(trim($data->musteriAdi)); $types .= "s"; }
    if (isset($data->musteriIletisim)) { $fields[] = "musteriIletisim = ?"; $params[] = $conn->real_escape_string(trim($data->musteriIletisim)); $types .= "s"; }
    if (isset($data->projeAdi)) { $fields[] = "projeAdi = ?"; $params[] = $conn->real_escape_string(trim($data->projeAdi)); $types .= "s"; }
    if (isset($data->teklifTarihi)) { $fields[] = "teklifTarihi = ?"; $params[] = $conn->real_escape_string(trim($data->teklifTarihi)); $types .= "s"; }
    if (isset($data->gecerlilikTarihi)) { $fields[] = "gecerlilikTarihi = ?"; $params[] = $conn->real_escape_string(trim($data->gecerlilikTarihi)); $types .= "s"; }
    if (isset($data->hazirlayan)) { $fields[] = "hazirlayan = ?"; $params[] = $conn->real_escape_string(trim($data->hazirlayan)); $types .= "s"; }
    if (isset($data->paraBirimi)) { $fields[] = "paraBirimi = ?"; $params[] = $conn->real_escape_string(trim($data->paraBirimi)); $types .= "s"; }
    if (isset($data->araToplamMaliyet)) { $fields[] = "araToplamMaliyet = ?"; $params[] = floatval($data->araToplamMaliyet); $types .= "d"; }
    if (isset($data->araToplamSatis)) { $fields[] = "araToplamSatis = ?"; $params[] = floatval($data->araToplamSatis); $types .= "d"; }
    if (isset($data->indirimOrani)) { $fields[] = "indirimOrani = ?"; $params[] = floatval($data->indirimOrani); $types .= "d"; }
    if (isset($data->indirimTutari)) { $fields[] = "indirimTutari = ?"; $params[] = floatval($data->indirimTutari); $types .= "d"; }
    
    $kdvOraniToUseForCalculations = $existingTeklif['kdvOrani']; // Mevcut KDV'yi al
    if (isset($data->kdvOrani)) { 
        $fields[] = "kdvOrani = ?"; 
        $params[] = floatval($data->kdvOrani); 
        $types .= "d"; 
        $kdvOraniToUseForCalculations = floatval($data->kdvOrani); // Yeni KDV'yi kullan
    }

    if (isset($data->kdvTutari)) { $fields[] = "kdvTutari = ?"; $params[] = floatval($data->kdvTutari); $types .= "d"; }
    if (isset($data->genelToplamSatis)) { $fields[] = "genelToplamSatis = ?"; $params[] = floatval($data->genelToplamSatis); $types .= "d"; }
    if (isset($data->durum)) { $fields[] = "durum = ?"; $params[] = $conn->real_escape_string(trim($data->durum)); $types .= "s"; }
    if (array_key_exists('notlar', (array)$data)) { $fields[] = "notlar = ?"; $params[] = ($data->notlar === null) ? null : $conn->real_escape_string(trim($data->notlar)); $types .= "s"; }
    
    if (empty($fields) && !isset($data->urunler)) { // Ürünler de güncellenmiyorsa ve hiç field yoksa
        http_response_code(400);
        echo json_encode(array("message" => "Güncellenecek alan bulunamadı."));
        $conn->rollback();
        return;
    }

    if (!empty($fields)) {
        $fields[] = "updated_at = NOW()";
        $sql_teklif_update = "UPDATE teklifler SET " . implode(", ", $fields) . " WHERE id = ?";
        $types .= "s"; 
        $params[] = $id_to_update;

        $stmt_teklif_update = $conn->prepare($sql_teklif_update);
        if (!$stmt_teklif_update) {
            http_response_code(500);
            echo json_encode(array("message" => "Ana teklif güncelleme sorgusu hazırlanamadı.", "error_detail" => $conn->error));
            $conn->rollback();
            return;
        }
        $stmt_teklif_update->bind_param($types, ...$params);
        if (!$stmt_teklif_update->execute()) {
            http_response_code(500);
            echo json_encode(array("message" => "Ana teklif güncellenirken SQL hatası.", "error_detail" => $stmt_teklif_update->error));
            $conn->rollback();
            $stmt_teklif_update->close();
            return;
        }
        $stmt_teklif_update->close();
    } else {
        // Sadece ürünler güncelleniyorsa ana tabloya updated_at ekleyelim
        $stmt_touch_update = $conn->prepare("UPDATE teklifler SET updated_at = NOW() WHERE id = ?");
        if ($stmt_touch_update) {
            $stmt_touch_update->bind_param("s", $id_to_update);
            $stmt_touch_update->execute();
            $stmt_touch_update->close();
        }
    }

    // Önce mevcut ürünleri sil (basit bir yaklaşım, daha iyisi UPDATE/INSERT/DELETE olabilir)
    $sql_delete_urunler = "DELETE FROM teklif_urunleri WHERE teklif_id = ?";
    $stmt_delete = $conn->prepare($sql_delete_urunler);
    if (!$stmt_delete) {
        http_response_code(500);
        echo json_encode(array("message" => "Güncelleme için eski ürünler silinirken SQL hazırlama hatası.", "error_detail" => $conn->error));
        $conn->rollback();
        return;
    }
    $stmt_delete->bind_param("s", $id_to_update);
    if (!$stmt_delete->execute()) {
        http_response_code(500);
        echo json_encode(array("message" => "Güncelleme için eski ürünler silinirken SQL hatası.", "error_detail" => $stmt_delete->error));
        $conn->rollback();
        $stmt_delete->close();
        return;
    }
    $stmt_delete->close();

    // Yeni ürünleri ekle
    if (isset($data->urunler) && is_array($data->urunler)) {
        $sql_urun_insert = "INSERT INTO teklif_urunleri (teklif_id, kalemTipi, referans_id, aciklama, miktar, birim, kaydedilen_birim_maliyet, kaydedilen_birim_satis_fiyati, kdv_orani_kalem, satir_toplam_maliyet, satir_toplam_satis_fiyati_kdv_haric, satir_kdv_tutari, satir_toplam_satis_fiyati_kdv_dahil, siraNo, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())";
        $stmt_urun_insert = $conn->prepare($sql_urun_insert);
        if (!$stmt_urun_insert) {
            http_response_code(500);
            echo json_encode(array("message" => "Güncellenen teklif için ürün ekleme sorgusu hazırlanamadı.", "error_detail" => $conn->error));
            $conn->rollback();
            return;
        }

        // KDV Oranını ana tekliften al, eğer güncellenmişse onu kullan
        $kdvOraniToUseForCalculations = isset($data->kdvOrani) ? floatval($data->kdvOrani) : 0;
        // Eğer kdvOrani gelmemişse, veritabanındaki mevcut kdvOrani'yi çekebiliriz, ancak bu örnekte varsayılan olarak 0 kullanılıyor.
        // Gerçek bir senaryoda, $id_to_update kullanarak ana teklifin kdvOrani'sini çekmek daha doğru olabilir.

        foreach ($data->urunler as $key => $urun) {
            if (!isset($urun->kalemTipi, $urun->aciklama, $urun->miktar, $urun->birim, $urun->kaydedilen_birim_satis_fiyati)) {
                 http_response_code(400);
                 echo json_encode(array("message" => "Güncellenen teklif ürünü için gerekli alanlar eksik. Ürün: " . json_encode($urun)));
                 $conn->rollback();
                 $stmt_urun_insert->close();
                 return;
            }
            $kalemTipi = $conn->real_escape_string(trim($urun->kalemTipi));
            // Öncelikli olarak urunId'yi kontrol et, sonra referans_id
            $referans_id = isset($urun->urunId) ? $conn->real_escape_string(trim($urun->urunId)) : (isset($urun->referans_id) ? $conn->real_escape_string(trim($urun->referans_id)) : null);
            $aciklama = $conn->real_escape_string(trim($urun->aciklama));
            $miktar = floatval($urun->miktar);
            $birim = $conn->real_escape_string(trim($urun->birim));
            $kaydedilen_birim_maliyet = isset($urun->kaydedilen_birim_maliyet) ? floatval($urun->kaydedilen_birim_maliyet) : 0.00;
            $kaydedilen_birim_satis_fiyati = floatval($urun->kaydedilen_birim_satis_fiyati);
            $kdv_orani_kalem = isset($urun->kdv_orani_kalem) ? floatval($urun->kdv_orani_kalem) : $kdvOraniToUseForCalculations;
            $satir_toplam_maliyet = $miktar * $kaydedilen_birim_maliyet;
            $satir_toplam_satis_fiyati_kdv_haric = $miktar * $kaydedilen_birim_satis_fiyati;
            $satir_kdv_tutari = $satir_toplam_satis_fiyati_kdv_haric * ($kdv_orani_kalem / 100);
            $satir_toplam_satis_fiyati_kdv_dahil = $satir_toplam_satis_fiyati_kdv_haric + $satir_kdv_tutari;
            $siraNo = isset($urun->siraNo) ? intval($urun->siraNo) : ($key + 1);

            $stmt_urun_insert->bind_param("ssssdsdddddddi", $id_to_update, $kalemTipi, $referans_id, $aciklama, $miktar, $birim, $kaydedilen_birim_maliyet, $kaydedilen_birim_satis_fiyati, $kdv_orani_kalem, $satir_toplam_maliyet, $satir_toplam_satis_fiyati_kdv_haric, $satir_kdv_tutari, $satir_toplam_satis_fiyati_kdv_dahil, $siraNo);
            if (!$stmt_urun_insert->execute()) {
                http_response_code(500);
                echo json_encode(array("message" => "Teklif ürünü güncellenirken/eklenirken SQL hatası.", "error_detail" => $stmt_urun_insert->error, "urun_data" => $urun));
                $conn->rollback();
                $stmt_urun_insert->close();
                return;
            }
        }
        $stmt_urun_insert->close();
    }

    $conn->commit();
    http_response_code(200);
    // Güncellenmiş teklifi geri döndür
    // getTeklif($conn, $teklif_id_url); // Bu tekrar JSON çıktısı yapar, bunun yerine manuel oluştur.
     echo json_encode(array("message" => "Teklif başarıyla güncellendi.", "id" => $id_to_update));

}

function deleteTeklif($conn, $id_param) {
    $id = $conn->real_escape_string(trim($id_param));

    $conn->begin_transaction();
    
    // 1. Teklifin var olup olmadığını kontrol et
    $check_exists_sql = "SELECT id FROM teklifler WHERE id = ?";
    $stmt_check_exists = $conn->prepare($check_exists_sql);
    if (!$stmt_check_exists) {
        http_response_code(500);
        echo json_encode(array("message" => "Silinecek teklif varlık kontrol sorgusu hazırlanamadı.", "error_detail" => $conn->error));
        $conn->rollback();
        return;
    }
    $stmt_check_exists->bind_param("s", $id);
    $stmt_check_exists->execute();
    $result_check = $stmt_check_exists->get_result(); // get_result() çağrısını değişkene ata
    if ($result_check->num_rows === 0) { // Değişken üzerinden kontrol et
        $stmt_check_exists->close();
        http_response_code(404);
        echo json_encode(array("message" => "Silinecek teklif bulunamadı. ID: " . $id));
        $conn->rollback();
        return;
    }
    $stmt_check_exists->close();

    // 2. Önce ilişkili teklif ürünlerini sil
    $sql_delete_urunler = "DELETE FROM teklif_urunleri WHERE teklif_id = ?";
    $stmt_delete_urunler = $conn->prepare($sql_delete_urunler);
    if (!$stmt_delete_urunler) {
        http_response_code(500);
        echo json_encode(array("message" => "Teklife bağlı ürünleri silme sorgusu hazırlanamadı.", "error_detail" => $conn->error));
        $conn->rollback();
        return;
    }
    $stmt_delete_urunler->bind_param("s", $id); // teklif_id VARCHAR
    if (!$stmt_delete_urunler->execute()) {
        http_response_code(500);
        echo json_encode(array("message" => "Teklife bağlı ürünler silinirken SQL hatası.", "error_detail" => $stmt_delete_urunler->error));
        $conn->rollback();
        $stmt_delete_urunler->close(); // Hata durumunda da kapat
        return;
    }
    // Ürün silme işleminde affected_rows kontrolü burada kritik değil, teklifin ürünü olmayabilir.
    $stmt_delete_urunler->close();

    // 3. Sonra ana teklifi sil
    $sql_delete_teklif = "DELETE FROM teklifler WHERE id = ?";
    $stmt_delete_teklif = $conn->prepare($sql_delete_teklif);
     if (!$stmt_delete_teklif) {
        http_response_code(500);
        echo json_encode(array("message" => "Ana teklif silme sorgusu hazırlanamadı.", "error_detail" => $conn->error));
        $conn->rollback();
        return;
    }
    $stmt_delete_teklif->bind_param("s", $id); // id VARCHAR

    if ($stmt_delete_teklif->execute()) {
        if ($stmt_delete_teklif->affected_rows > 0) {
            $conn->commit(); // Sadece ana teklif başarıyla silinirse commit et
            http_response_code(200);
            echo json_encode(array("message" => "Teklif ve bağlı ürünleri başarıyla silindi.", "id" => $id));
        } else {
            // Varlık kontrolünden geçtiği için buraya düşmemeli, ama olası bir yarış durumu için.
            $conn->rollback();
            http_response_code(404); 
            echo json_encode(array("message" => "Teklif silinemedi (ana teklif üzerinde affected_rows = 0). ID: " . $id));
        }
    } else {
        http_response_code(500);
        echo json_encode(array("message" => "Teklif silinirken SQL hatası.", "error_detail" => $stmt_delete_teklif->error));
        $conn->rollback();
    }
    $stmt_delete_teklif->close();
}

$conn->close();
?> 