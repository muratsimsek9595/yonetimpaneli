<?php
define('DB_SERVER', 'srvc157.trwww.com'); // MySQL sunucu adresiniz
define('DB_USERNAME', 'hsnplant_muratsi');      // MySQL kullanıcı adınız
define('DB_PASSWORD', 'bz.ZMUe.Xa2Zj.V');  // MySQL şifreniz
define('DB_DATABASE', 'hsnplant_yonetimDB'); // Veritabanı adınız

// Bağlantı oluşturma
$conn = new mysqli(DB_SERVER, DB_USERNAME, DB_PASSWORD, DB_DATABASE);

// Bağlantıyı kontrol etme
if ($conn->connect_error) {
    // Hata durumunda JSON yanıtı hazırla ve betiği sonlandır
    header('Content-Type: application/json'); // Bu başlık burada olmalı
    http_response_code(500); // Sunucu hatası
    echo json_encode([
        'error' => 'Veritabanı bağlantı hatası.',
        'details' => $conn->connect_error // Geliştirme aşamasında detayı görmek isteyebilirsiniz
    ]);
    exit; // die() yerine exit kullanmak daha standarttır.
}

// Karakter setini ayarla (önerilir)
if (!$conn->set_charset("utf8mb4")) {
    // Hata durumunda loglama yapılabilir
    // printf("Error loading character set utf8mb4: %s\n", $conn->error);
    // Karakter seti hatasını da JSON olarak döndürebilirsiniz,
    // ancak bu genellikle daha az kritik bir hatadır.
    // Şimdilik loglama veya sessiz hata yönetimi yeterli olabilir.
    // error_log("Error loading character set utf8mb4: " . $conn->error);
}

// Bu dosya başka PHP dosyaları tarafından 'require' veya 'include' edileceği için,
// burada doğrudan bir çıktı üretmemelidir (HTML vb.).
// Bağlantı nesnesi ($conn) bu dosyayı include eden script'ler tarafından kullanılabilir olacak.
?>