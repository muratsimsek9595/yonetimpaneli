<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header("Content-Type: application/json; charset=UTF-8");

require_once '/home/hsnplant/public_html/demo/config/db_config.php';

if ($conn === null || $conn->connect_error) {
    http_response_code(503);
    echo json_encode(array("message" => "Veritabanı bağlantısı kurulamadı.", "error" => ($conn ? $conn->connect_error : "Bağlantı nesnesi null.")));
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];
$id_url = isset($_GET['id']) ? trim($_GET['id']) : null;

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
        // $id_url PUT isteklerinde $_GET ile gelmeyebilir, request body'den de okunabilir.
        // Ancak mevcut yapı /api/teklifler.php?id=xxx şeklinde bekliyor.
        $put_data = json_decode(file_get_contents("php://input"));
        $id_from_body = isset($put_data->id) ? trim($put_data->id) : null;
        $final_id = $id_url ? $id_url : $id_from_body;

        if ($final_id) {
            updateTeklif($conn, $final_id, $put_data);
        } else {
            http_response_code(400);
            echo json_encode(array("message" => "Güncellenecek teklif ID'si belirtilmedi (URL'de veya gövdede 'id' olarak)."));
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
            ORDER BY t.teklifTarihi DESC, t.id DESC";
    $result = $conn->query($sql);
    $teklifler = array();

    if ($result) {
        while($row = $result->fetch_assoc()) {
            // Kalemleri (urunler/iscilikler) çek
            $kalemler_sql = "SELECT * FROM teklif_kalemleri WHERE teklif_id = ? ORDER BY siraNo ASC, id ASC";
            $stmt_kalemler = $conn->prepare($kalemler_sql);
            if ($stmt_kalemler) {
                $stmt_kalemler->bind_param("s", $row['id']);
                $stmt_kalemler->execute();
                $kalemler_result = $stmt_kalemler->get_result();
                $row['urunler'] = array(); // Frontend 'urunler' anahtarını bekliyor
                while($kalem_row = $kalemler_result->fetch_assoc()) {
                    // Gelen tüm sütunları doğrudan ekle, frontend kalemTipi'ne göre işleyecek
                    $row['urunler'][] = $kalem_row;
                }
                $stmt_kalemler->close();
            } else {
                 $row['urunler'] = array("error_detail" => "Teklif kalemleri SQL hazırlama hatası: " . $conn->error);
            }
            $teklifler[] = $row;
        }
        http_response_code(200);
        echo json_encode(array("success" => true, "data" => $teklifler));
    } else {
        http_response_code(500);
        echo json_encode(array("success" => false, "message" => "Teklifler getirilirken SQL hatası oluştu.", "error_detail" => $conn->error));
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
        $stmt->bind_param("s", $id_escaped);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows > 0) {
            $teklif = $result->fetch_assoc();
            $kalemler_sql = "SELECT * FROM teklif_kalemleri WHERE teklif_id = ? ORDER BY siraNo ASC, id ASC";
            $stmt_kalemler = $conn->prepare($kalemler_sql);
            if ($stmt_kalemler) {
                $stmt_kalemler->bind_param("s", $teklif['id']);
                $stmt_kalemler->execute();
                $kalemler_result = $stmt_kalemler->get_result();
                $teklif['urunler'] = array(); // Frontend 'urunler' anahtarını bekliyor
                while($kalem_row = $kalemler_result->fetch_assoc()) {
                    $teklif['urunler'][] = $kalem_row;
                }
                $stmt_kalemler->close();
            } else {
                 $teklif['urunler'] = array("error_detail" => "Teklif kalemleri SQL hazırlama hatası: " . $conn->error);
            }
            http_response_code(200);
            echo json_encode(array("success" => true, "data" => $teklif));
        } else {
            http_response_code(404);
            echo json_encode(array("success" => false, "message" => "Teklif bulunamadı. ID: " . $id));
        }
        $stmt->close();
    } else {
        http_response_code(500);
        echo json_encode(array("success" => false, "message" => "Teklif getirilirken SQL hazırlama hatası oluştu.", "error_detail" => $conn->error));
    }
}

function addTeklif($conn) {
    $data = json_decode(file_get_contents("php://input"));

    if (!isset($data->teklifNo, $data->teklifTarihi, $data->urunler) || !is_array($data->urunler)) {
        http_response_code(400);
        echo json_encode(array("success" => false, "message" => "Teklif eklemek için gerekli alanlar (teklifNo, teklifTarihi, urunler dizisi) eksik veya hatalı."));
        return;
    }

    $conn->begin_transaction();

    $id = uniqid('teklif_', true); // Benzersiz ID sunucuda üretiliyor
    $teklifNo = $conn->real_escape_string(trim($data->teklifNo));
    $musteri_id = isset($data->musteriId) && !empty(trim($data->musteriId)) ? intval(trim($data->musteriId)) : (isset($data->musteri_id) && !empty(trim($data->musteri_id)) ? intval(trim($data->musteri_id)) : null); // musteriId veya musteri_id
    $musteriAdi = isset($data->musteriAdi) ? $conn->real_escape_string(trim($data->musteriAdi)) : null;
    $musteriIletisim = isset($data->musteriIletisim) ? $conn->real_escape_string(trim($data->musteriIletisim)) : null;
    $projeAdi = isset($data->projeAdi) ? $conn->real_escape_string(trim($data->projeAdi)) : null;
    $teklifTarihi = $conn->real_escape_string(trim($data->teklifTarihi));
    $gecerlilikTarihi = isset($data->gecerlilikTarihi) ? $conn->real_escape_string(trim($data->gecerlilikTarihi)) : null;
    $hazirlayan = isset($data->hazirlayan) ? $conn->real_escape_string(trim($data->hazirlayan)) : null;
    $paraBirimi = isset($data->paraBirimi) ? $conn->real_escape_string(trim($data->paraBirimi)) : 'TL';
    
    // Toplamlar frontend'den geliyor ve doğrudan kaydediliyor.
    // Backend'de de hesaplama yapılabilir, şimdilik frontend'e güveniyoruz.
    $araToplamSatis = isset($data->araToplam) ? floatval($data->araToplam) : (isset($data->araToplamSatis) ? floatval($data->araToplamSatis) : 0.00);
    $indirimOrani = isset($data->indirimOrani) ? floatval($data->indirimOrani) : 0.00;
    $indirimTutari = isset($data->indirimTutari) ? floatval($data->indirimTutari) : 0.00;
    $kdvOrani = isset($data->kdvOrani) ? floatval($data->kdvOrani) : (isset($data->kdv_orani) ? floatval($data->kdv_orani) : 0.00);
    $kdvTutari = isset($data->kdvTutari) ? floatval($data->kdvTutari) : 0.00;
    $genelToplamSatis = isset($data->genelToplamSatis) ? floatval($data->genelToplamSatis) : 0.00;
    
    // KDV Dahil Toplam Proje Maliyetini al (frontend'den hesaplanan_toplamProjeMaliyetiKdvDahil olarak gelir)
    $araToplamMaliyet = isset($data->hesaplanan_toplamProjeMaliyetiKdvDahil) ? floatval($data->hesaplanan_toplamProjeMaliyetiKdvDahil) : 0.00;

    $durum = isset($data->durum) ? $conn->real_escape_string(trim($data->durum)) : 'Hazırlanıyor';
    $notlar = isset($data->notlar) ? $conn->real_escape_string(trim($data->notlar)) : null;

    $checkSqlNo = "SELECT id FROM teklifler WHERE teklifNo = ?";
    $stmt_check_no = $conn->prepare($checkSqlNo);
    if (!$stmt_check_no) {
        http_response_code(500);
        echo json_encode(array("success" => false, "message" => "Teklif No kontrol sorgusu hazırlanamadı.", "error_detail" => $conn->error));
        $conn->rollback();
        return;
    }
    $stmt_check_no->bind_param("s", $teklifNo);
    $stmt_check_no->execute();
    if ($stmt_check_no->get_result()->num_rows > 0) {
        $stmt_check_no->close();
        http_response_code(409);
        echo json_encode(array("success" => false, "message" => "Bu Teklif No ('$teklifNo') ile zaten bir teklif kayıtlı."));
        $conn->rollback();
        return;
    }
    $stmt_check_no->close();

    $sql_teklif = "INSERT INTO teklifler (id, teklifNo, musteri_id, musteriAdi, musteriIletisim, projeAdi, teklifTarihi, gecerlilikTarihi, hazirlayan, paraBirimi, araToplamMaliyet, araToplamSatis, indirimOrani, indirimTutari, kdvOrani, kdvTutari, genelToplamSatis, durum, notlar, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())";
    $stmt_teklif = $conn->prepare($sql_teklif);
    if (!$stmt_teklif) {
        http_response_code(500); 
        echo json_encode(array("success" => false, "message" => "Ana teklif ekleme sorgusu hazırlanamadı: " . $conn->error));
        $conn->rollback(); 
        return;
    }
    $stmt_teklif->bind_param("ssissssssdddddddsss", $id, $teklifNo, $musteri_id, $musteriAdi, $musteriIletisim, $projeAdi, $teklifTarihi, $gecerlilikTarihi, $hazirlayan, $paraBirimi, $araToplamMaliyet, $araToplamSatis, $indirimOrani, $indirimTutari, $kdvOrani, $kdvTutari, $genelToplamSatis, $durum, $notlar);

    if (!$stmt_teklif->execute()) {
        http_response_code(500);
        echo json_encode(array("success" => false, "message" => "Ana teklif kaydedilemedi: " . $stmt_teklif->error));
        $conn->rollback();
        $stmt_teklif->close();
        return;
    }
    $stmt_teklif->close();

    // Teklif Kalemlerini (urunler/iscilikler) Ekle
    // teklif_kalemleri tablosu: id, teklif_id, kalemTipi, referans_id, aciklama, miktar, birim, 
    // kaydedilen_birim_maliyet, kaydedilen_birim_satis_fiyati, kdv_orani_kalem, 
    // satir_toplam_maliyet, satir_toplam_satis_fiyati_kdv_haric, satir_kdv_tutari, 
    // satir_toplam_satis_fiyati_kdv_dahil, siraNo, created_at, updated_at
    $sql_kalem = "INSERT INTO teklif_kalemleri (teklif_id, kalemTipi, malzeme_id, isci_id, aciklama, miktar, birim, kaydedilen_birim_satis_fiyati, kdv_orani_kalem, satir_toplam_satis_fiyati_kdv_haric, satir_kdv_tutari, satir_toplam_satis_fiyati_kdv_dahil, siraNo, kaydedilen_birim_maliyet, satir_toplam_maliyet, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())";
    $stmt_kalem = $conn->prepare($sql_kalem);
    if (!$stmt_kalem) {
        http_response_code(500);
        echo json_encode(array("success" => false, "message" => "Teklif kalemi ekleme sorgusu hazırlanamadı: " . $conn->error));
        $conn->rollback();
        return;
    }

    foreach ($data->urunler as $key => $kalem) {
        if (!isset($kalem->kalemTipi, $kalem->aciklama, $kalem->miktar, $kalem->birim, $kalem->kaydedilen_birim_satis_fiyati) || ($kalem->kalemTipi !== 'malzeme' && $kalem->kalemTipi !== 'iscilik')) {
             http_response_code(400);
             echo json_encode(array("success" => false, "message" => "Teklif kalemi için gerekli alanlar eksik veya kalemTipi geçersiz. Kalem: " . json_encode($kalem)));
             $conn->rollback();
             $stmt_kalem->close();
             return;
        }
        $kalemTipi = $conn->real_escape_string(trim($kalem->kalemTipi));
        
        $malzeme_id = null;
        $isci_id = null;

        if ($kalemTipi === 'malzeme' && isset($kalem->referans_id)) {
            $malzeme_id = intval(trim($kalem->referans_id)); 
        } elseif ($kalemTipi === 'iscilik' && isset($kalem->referans_id)) {
            $isci_id = intval(trim($kalem->referans_id));
        }

        $aciklama = $conn->real_escape_string(trim($kalem->aciklama));
        $miktar = floatval($kalem->miktar);
        $birim = $conn->real_escape_string(trim($kalem->birim));
        $kaydedilen_birim_satis_fiyati = floatval($kalem->kaydedilen_birim_satis_fiyati);
        
        $kdv_orani_kalem_input = isset($kalem->kdv_orani_kalem) ? floatval($kalem->kdv_orani_kalem) : (isset($data->kdvOrani) ? floatval($data->kdvOrani) : 0);
        $satir_toplam_satis_fiyati_kdv_haric = $miktar * $kaydedilen_birim_satis_fiyati;
        $satir_kdv_tutari = $satir_toplam_satis_fiyati_kdv_haric * ($kdv_orani_kalem_input / 100);
        $satir_toplam_satis_fiyati_kdv_dahil = $satir_toplam_satis_fiyati_kdv_haric + $satir_kdv_tutari;
        $siraNo = $key + 1;
        $kaydedilen_birim_maliyet = isset($kalem->kaydedilen_birim_maliyet) ? floatval($kalem->kaydedilen_birim_maliyet) : 0.00;
        $satir_toplam_maliyet = $miktar * $kaydedilen_birim_maliyet;

        $stmt_kalem->bind_param("ssiisdsdddddiid", 
            $id, 
            $kalemTipi, 
            $malzeme_id, 
            $isci_id, 
            $aciklama, 
            $miktar, 
            $birim, 
            $kaydedilen_birim_satis_fiyati, 
            $kdv_orani_kalem_input, 
            $satir_toplam_satis_fiyati_kdv_haric, 
            $satir_kdv_tutari, 
            $satir_toplam_satis_fiyati_kdv_dahil, 
            $siraNo,
            $kaydedilen_birim_maliyet,
            $satir_toplam_maliyet
        );

        if (!$stmt_kalem->execute()) {
            http_response_code(500);
            echo json_encode(array("success" => false, "message" => "Teklif kalemi kaydedilemedi: " . $stmt_kalem->error, "kalem_data" => $kalem));
            $conn->rollback();
            $stmt_kalem->close();
            return;
        }
    }
    $stmt_kalem->close();

    $conn->commit();
    http_response_code(201); // Created
    // Başarılı yanıtta güncel teklif verisini döndür
    $newTeklifData = array(
        'id' => $id,
        'teklifNo' => $teklifNo,
        'musteriId' => $musteri_id,
        'musteriAdi' => $musteriAdi,
        'musteriIletisim' => $musteriIletisim,
        'projeAdi' => $projeAdi,
        'teklifTarihi' => $teklifTarihi,
        'gecerlilikTarihi' => $gecerlilikTarihi,
        'hazirlayan' => $hazirlayan,
        'paraBirimi' => $paraBirimi,
        'araToplam' => $araToplamSatis, // araToplamSatis -> araToplam
        'indirimOrani' => $indirimOrani,
        'indirimTutari' => $indirimTutari,
        'kdvOrani' => $kdvOrani,
        'kdvTutari' => $kdvTutari,
        'genelToplamSatis' => $genelToplamSatis,
        'durum' => $durum,
        'notlar' => $notlar,
        'urunler' => $data->urunler, // Gelen kalemleri olduğu gibi döndür
        'created_at' => date('Y-m-d H:i:s'), // Yaklaşık değer
        'updated_at' => date('Y-m-d H:i:s')  // Yaklaşık değer
    );
    echo json_encode(array("success" => true, "message" => "Teklif başarıyla eklendi.", "data" => $newTeklifData));
}

function updateTeklif($conn, $teklif_id_param, $data) {
    // $data zaten json_decode edilmiş olarak gelmeli (switch case'den)
    if (!$data) {
        http_response_code(400);
        echo json_encode(array("success" => false, "message" => "Güncelleme için veri alınamadı."));
        return;
    }

    $teklif_id = $conn->real_escape_string($teklif_id_param);

    // Teklifin var olup olmadığını kontrol et
    $checkTeklifSql = "SELECT id FROM teklifler WHERE id = ?";
    $stmt_check = $conn->prepare($checkTeklifSql);
    if(!$stmt_check) { /* ... hata ... */ http_response_code(500); echo json_encode(["success"=>false, "message"=>"Teklif kontrol sorgusu hatası: ".$conn->error]); return; }
    $stmt_check->bind_param("s", $teklif_id);
    $stmt_check->execute();
    $result_check = $stmt_check->get_result();
    if ($result_check->num_rows === 0) {
        http_response_code(404);
        echo json_encode(array("success" => false, "message" => "Güncellenecek teklif bulunamadı. ID: " . $teklif_id));
        $stmt_check->close();
        return;
    }
    $stmt_check->close();

    // Ana teklif bilgilerini al ve güncelle (addTeklif benzeri)
    $teklifNo = isset($data->teklifNo) ? $conn->real_escape_string(trim($data->teklifNo)) : null; // TeklifNo güncellenebilir mi? Genelde unique olur.
    $musteri_id = isset($data->musteriId) && !empty(trim($data->musteriId)) ? intval(trim($data->musteriId)) : (isset($data->musteri_id) && !empty(trim($data->musteri_id)) ? intval(trim($data->musteri_id)) : null);
    $musteriAdi = isset($data->musteriAdi) ? $conn->real_escape_string(trim($data->musteriAdi)) : null;
    $musteriIletisim = isset($data->musteriIletisim) ? $conn->real_escape_string(trim($data->musteriIletisim)) : null;
    $projeAdi = isset($data->projeAdi) ? $conn->real_escape_string(trim($data->projeAdi)) : null;
    $teklifTarihi = isset($data->teklifTarihi) ? $conn->real_escape_string(trim($data->teklifTarihi)) : null;
    $gecerlilikTarihi = isset($data->gecerlilikTarihi) ? $conn->real_escape_string(trim($data->gecerlilikTarihi)) : null;
    $hazirlayan = isset($data->hazirlayan) ? $conn->real_escape_string(trim($data->hazirlayan)) : null;
    $paraBirimi = isset($data->paraBirimi) ? $conn->real_escape_string(trim($data->paraBirimi)) : 'TL';
    
    $araToplamSatis = isset($data->araToplam) ? floatval($data->araToplam) : (isset($data->araToplamSatis) ? floatval($data->araToplamSatis) : 0.00);
    $indirimOrani = isset($data->indirimOrani) ? floatval($data->indirimOrani) : 0.00;
    $indirimTutari = isset($data->indirimTutari) ? floatval($data->indirimTutari) : 0.00;
    $kdvOrani = isset($data->kdvOrani) ? floatval($data->kdvOrani) : (isset($data->kdv_orani) ? floatval($data->kdv_orani) : 0.00);
    $kdvTutari = isset($data->kdvTutari) ? floatval($data->kdvTutari) : 0.00;
    $genelToplamSatis = isset($data->genelToplamSatis) ? floatval($data->genelToplamSatis) : 0.00;
    
    // KDV Dahil Toplam Proje Maliyetini al (frontend'den hesaplanan_toplamProjeMaliyetiKdvDahil olarak gelir)
    $araToplamMaliyet = isset($data->hesaplanan_toplamProjeMaliyetiKdvDahil) ? floatval($data->hesaplanan_toplamProjeMaliyetiKdvDahil) : 0.00;

    $durum = isset($data->durum) ? $conn->real_escape_string(trim($data->durum)) : 'Hazırlanıyor';
    $notlar = isset($data->notlar) ? $conn->real_escape_string(trim($data->notlar)) : null;

    $conn->begin_transaction();

    // Teklif No benzersizlik kontrolü (güncelleme sırasında, mevcut ID hariç)
    if (!empty($teklifNo)) {
        $checkSqlNoUpd = "SELECT id FROM teklifler WHERE teklifNo = ? AND id != ?";
        $stmt_check_no_upd = $conn->prepare($checkSqlNoUpd);
        if (!$stmt_check_no_upd) { /* ... hata ... */ $conn->rollback(); http_response_code(500); echo json_encode(["success"=>false, "message"=>"TNo Upd Chk Err: ".$conn->error]); return;}
        $stmt_check_no_upd->bind_param("ss", $teklifNo, $teklif_id);
        $stmt_check_no_upd->execute();
        if ($stmt_check_no_upd->get_result()->num_rows > 0) {
            $stmt_check_no_upd->close();
            http_response_code(409);
            echo json_encode(array("success" => false, "message" => "Bu Teklif No ('$teklifNo') ile zaten başka bir teklif kayıtlı."));
            $conn->rollback();
            return;
        }
        $stmt_check_no_upd->close();
    }

    $sql_teklif_update = "UPDATE teklifler SET teklifNo = ?, musteri_id = ?, musteriAdi = ?, musteriIletisim = ?, projeAdi = ?, teklifTarihi = ?, gecerlilikTarihi = ?, hazirlayan = ?, paraBirimi = ?, araToplamMaliyet = ?, araToplamSatis = ?, indirimOrani = ?, indirimTutari = ?, kdvOrani = ?, kdvTutari = ?, genelToplamSatis = ?, durum = ?, notlar = ?, updated_at = NOW() WHERE id = ?";
    $stmt_teklif_update = $conn->prepare($sql_teklif_update);
    if (!$stmt_teklif_update) {
        http_response_code(500);
        echo json_encode(array("success" => false, "message" => "Ana teklif güncelleme sorgusu hazırlanamadı: " . $conn->error));
        $conn->rollback();
        return;
    }
    $stmt_teklif_update->bind_param("sissssssdddddddssss", $teklifNo, $musteri_id, $musteriAdi, $musteriIletisim, $projeAdi, $teklifTarihi, $gecerlilikTarihi, $hazirlayan, $paraBirimi, $araToplamMaliyet, $araToplamSatis, $indirimOrani, $indirimTutari, $kdvOrani, $kdvTutari, $genelToplamSatis, $durum, $notlar, $teklif_id);

    if (!$stmt_teklif_update->execute()) {
        http_response_code(500);
        echo json_encode(array("success" => false, "message" => "Ana teklif güncellenemedi: " . $stmt_teklif_update->error));
        $conn->rollback();
        $stmt_teklif_update->close();
        return;
    }
    $stmt_teklif_update->close();

    // Mevcut teklif kalemlerini sil
    $sql_delete_kalemler = "DELETE FROM teklif_kalemleri WHERE teklif_id = ?";
    $stmt_delete_kalemler = $conn->prepare($sql_delete_kalemler);
    if (!$stmt_delete_kalemler) {
        http_response_code(500);
        echo json_encode(array("success" => false, "message" => "Eski kalemleri silme sorgusu hazırlanamadı: " . $conn->error));
        $conn->rollback();
        return;
    }
    $stmt_delete_kalemler->bind_param("s", $teklif_id);
    if (!$stmt_delete_kalemler->execute()) {
        http_response_code(500);
        echo json_encode(array("success" => false, "message" => "Eski teklif kalemleri silinemedi: " . $stmt_delete_kalemler->error));
        $conn->rollback();
        $stmt_delete_kalemler->close();
        return;
    }
    $stmt_delete_kalemler->close();

    // Yeni teklif kalemlerini ekle (addTeklif'teki gibi)
    if (isset($data->urunler) && is_array($data->urunler) && count($data->urunler) > 0) {
        $sql_kalem_insert = "INSERT INTO teklif_kalemleri (teklif_id, kalemTipi, malzeme_id, isci_id, aciklama, miktar, birim, kaydedilen_birim_satis_fiyati, kdv_orani_kalem, satir_toplam_satis_fiyati_kdv_haric, satir_kdv_tutari, satir_toplam_satis_fiyati_kdv_dahil, siraNo, kaydedilen_birim_maliyet, satir_toplam_maliyet, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())";
        $stmt_kalem_insert = $conn->prepare($sql_kalem_insert);
        if (!$stmt_kalem_insert) {
            http_response_code(500);
            echo json_encode(array("success" => false, "message" => "Yeni kalem ekleme sorgusu hazırlanamadı: " . $conn->error));
            $conn->rollback();
            return;
        }

        foreach ($data->urunler as $key => $kalem) {
            if (!isset($kalem->kalemTipi, $kalem->aciklama, $kalem->miktar, $kalem->birim, $kalem->kaydedilen_birim_satis_fiyati) || ($kalem->kalemTipi !== 'malzeme' && $kalem->kalemTipi !== 'iscilik')) {
                http_response_code(400);
                echo json_encode(array("success" => false, "message" => "Teklif kalemi (güncelleme) için gerekli alanlar eksik veya kalemTipi geçersiz. Kalem: " . json_encode($kalem)));
                $conn->rollback();
                $stmt_kalem_insert->close();
                return;
            }
            $kalemTipi = $conn->real_escape_string(trim($kalem->kalemTipi));
            $malzeme_id = null;
            $isci_id = null;

            if ($kalemTipi === 'malzeme' && isset($kalem->referans_id)) {
                $malzeme_id = intval(trim($kalem->referans_id)); 
            } elseif ($kalemTipi === 'iscilik' && isset($kalem->referans_id)) {
                $isci_id = intval(trim($kalem->referans_id));
            }
            
            $aciklama = $conn->real_escape_string(trim($kalem->aciklama));
            $miktar = floatval($kalem->miktar);
            $birim = $conn->real_escape_string(trim($kalem->birim));
            $kaydedilen_birim_satis_fiyati = floatval($kalem->kaydedilen_birim_satis_fiyati);
            
            $kdv_orani_kalem_input = isset($kalem->kdv_orani_kalem) ? floatval($kalem->kdv_orani_kalem) : (isset($data->kdvOrani) ? floatval($data->kdvOrani) : 0);
            $satir_toplam_satis_fiyati_kdv_haric = $miktar * $kaydedilen_birim_satis_fiyati;
            $satir_kdv_tutari = $satir_toplam_satis_fiyati_kdv_haric * ($kdv_orani_kalem_input / 100);
            $satir_toplam_satis_fiyati_kdv_dahil = $satir_toplam_satis_fiyati_kdv_haric + $satir_kdv_tutari;
            $siraNo = $key + 1;
            $kaydedilen_birim_maliyet = isset($kalem->kaydedilen_birim_maliyet) ? floatval($kalem->kaydedilen_birim_maliyet) : 0.00;
            $satir_toplam_maliyet = $miktar * $kaydedilen_birim_maliyet;

            $stmt_kalem_insert->bind_param("ssiisdsdddddiid", 
                $teklif_id, 
                $kalemTipi, 
                $malzeme_id, 
                $isci_id, 
                $aciklama, 
                $miktar, 
                $birim, 
                $kaydedilen_birim_satis_fiyati, 
                $kdv_orani_kalem_input, 
                $satir_toplam_satis_fiyati_kdv_haric, 
                $satir_kdv_tutari, 
                $satir_toplam_satis_fiyati_kdv_dahil, 
                $siraNo,
                $kaydedilen_birim_maliyet,
                $satir_toplam_maliyet
            );

            if (!$stmt_kalem_insert->execute()) {
                http_response_code(500);
                echo json_encode(array("success" => false, "message" => "Yeni teklif kalemi (güncelleme) kaydedilemedi: " . $stmt_kalem_insert->error, "kalem_data" => $kalem));
                $conn->rollback();
                $stmt_kalem_insert->close();
                return;
            }
        }
        $stmt_kalem_insert->close();
    }

    $conn->commit();
    http_response_code(200); // OK
    // Başarılı yanıtta güncel teklif verisini döndür (getTeklif gibi)
    $updatedTeklifData = array(
        'id' => $teklif_id,
        'teklifNo' => $teklifNo,
        'musteriId' => $musteri_id,
        'musteriAdi' => $musteriAdi,
        'musteriIletisim' => $musteriIletisim,
        'projeAdi' => $projeAdi,
        'teklifTarihi' => $teklifTarihi,
        'gecerlilikTarihi' => $gecerlilikTarihi,
        'hazirlayan' => $hazirlayan,
        'paraBirimi' => $paraBirimi,
        'araToplam' => $araToplamSatis,
        'indirimOrani' => $indirimOrani,
        'indirimTutari' => $indirimTutari,
        'kdvOrani' => $kdvOrani,
        'kdvTutari' => $kdvTutari,
        'genelToplamSatis' => $genelToplamSatis,
        'durum' => $durum,
        'notlar' => $notlar,
        'urunler' => isset($data->urunler) ? $data->urunler : array(),
        'updated_at' => date('Y-m-d H:i:s') // Yaklaşık değer
        // created_at değeri değişmez, veritabanından çekilebilir gerekirse.
    );
    echo json_encode(array("success" => true, "message" => "Teklif başarıyla güncellendi.", "data" => $updatedTeklifData));
}

function deleteTeklif($conn, $id_param) {
    $id = $conn->real_escape_string($id_param);

    $conn->begin_transaction();

    // Önce ilişkili kalemleri (urunler) sil
    $sql_delete_urunler = "DELETE FROM teklif_kalemleri WHERE teklif_id = ?";
    $stmt_delete_urunler = $conn->prepare($sql_delete_urunler);
    if (!$stmt_delete_urunler) {
        http_response_code(500);
        echo json_encode(array("success" => false, "message" => "Teklif ürünleri silme sorgusu hazırlanamadı: " . $conn->error));
        $conn->rollback();
        return;
    }
    $stmt_delete_urunler->bind_param("s", $id);
    if (!$stmt_delete_urunler->execute()) {
        http_response_code(500);
        echo json_encode(array("success" => false, "message" => "Teklif ürünleri silinemedi: " . $stmt_delete_urunler->error));
        $conn->rollback();
        $stmt_delete_urunler->close();
        return;
    }
    $stmt_delete_urunler->close();

    // Sonra ana teklifi sil
    $sql_delete_teklif = "DELETE FROM teklifler WHERE id = ?";
    $stmt_delete_teklif = $conn->prepare($sql_delete_teklif);
    if (!$stmt_delete_teklif) {
        http_response_code(500);
        echo json_encode(array("success" => false, "message" => "Ana teklif silme sorgusu hazırlanamadı: " . $conn->error));
        $conn->rollback();
        return;
    }
    $stmt_delete_teklif->bind_param("s", $id);

    if ($stmt_delete_teklif->execute()) {
        if ($stmt_delete_teklif->affected_rows > 0) {
            $conn->commit();
            http_response_code(200);
            echo json_encode(array("success" => true, "message" => "Teklif başarıyla silindi."));
        } else {
            $conn->rollback(); // Silinecek bir şey bulunamadıysa, işlemi geri al
            http_response_code(404);
            echo json_encode(array("success" => false, "message" => "Silinecek teklif bulunamadı. ID: " . $id));
        }
    } else {
        $conn->rollback();
        http_response_code(500);
        echo json_encode(array("success" => false, "message" => "Teklif silinirken SQL hatası: " . $stmt_delete_teklif->error));
    }
    $stmt_delete_teklif->close();
}

$conn->close();
?> 