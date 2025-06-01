<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
ob_start();

require_once '../config/db_config.php'; // Veritabanı bağlantısını include et

$tedarikciler = array();
$sql = "SELECT id, ad, yetkili_kisi, telefon, email, adres FROM tedarikciler ORDER BY ad ASC";
$result = $conn->query($sql);

if ($result) {
    if ($result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            $tedarikciler[] = $row;
        }
        ob_clean();
        header("Access-Control-Allow-Origin: *");
        header("Content-Type: application/json; charset=UTF-8");
        echo json_encode($tedarikciler);
    } else {
        ob_clean();
        header("Access-Control-Allow-Origin: *");
        header("Content-Type: application/json; charset=UTF-8");
        echo json_encode([]); // Boş dizi döndür, tedarikçi yoksa
    }
} else {
    // Sorgu hatası durumunda
    ob_clean();
    header("Access-Control-Allow-Origin: *");
    header("Content-Type: application/json; charset=UTF-8");
    http_response_code(500); // Internal Server Error
    echo json_encode(
        array("message" => "Tedarikçiler getirilirken bir hata oluştu.", "error" => $conn->error)
    );
}

$conn->close();
?> 