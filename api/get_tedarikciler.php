<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *"); // Geliştirme için, canlıda daha kısıtlı olabilir

require_once '../config/db_config.php'; // Veritabanı bağlantısını include et

$tedarikciler = array();
$sql = "SELECT id, ad, yetkili_kisi, telefon, email, adres FROM tedarikciler ORDER BY ad ASC";
$result = $conn->query($sql);

if ($result) {
    if ($result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            $tedarikciler[] = $row;
        }
        echo json_encode($tedarikciler);
    } else {
        echo json_encode([]); // Boş dizi döndür, tedarikçi yoksa
    }
} else {
    // Sorgu hatası durumunda
    http_response_code(500); // Internal Server Error
    echo json_encode(
        array("message" => "Tedarikçiler getirilirken bir hata oluştu.", "error" => $conn->error)
    );
}

$conn->close();
?> 