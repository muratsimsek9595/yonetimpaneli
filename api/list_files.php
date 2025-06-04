<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *"); // Geliştirme için, canlıda daha kısıtlı olabilir
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ÖNEMLİ GÜVENLİK NOTU:
// Bu BASE_PATH, web sunucusunun erişebileceği KÖK DİZİNİNİZDEN İTİBAREN HESAPLANMALIDIR.
// Örneğin, web siteniz /home/user/public_html/ altında çalışıyorsa ve
// dosyaları /home/user/public_html/tools/ altında listelemek istiyorsanız,
// BASE_PATH = 'tools/'; OLMALIDIR.
// Eğer proje ana dizininiz /home/user/public_html/yonetimpaneli/ ise ve
// dosyalar /home/user/public_html/tools/ altında ise, o zaman BASE_PATH,
// bu script'in bulunduğu yerden göreceli olarak '../../tools/' gibi olabilir
// VEYA DAHA İYİSİ, TAM SUNUCU YOLU KULLANILMALIDIR ($_SERVER['DOCUMENT_ROOT'] ile birleştirilerek).

// Basitlik adına, bu script'in bir üst dizinindeki 'tools' klasörünü hedefleyelim.
// Canlı bir ortamda bu yolu dikkatlice yapılandırın!
// Örneğin: $baseDir = realpath(__DIR__ . '/../../tools'); // Bu script api/ içinde, ../ ana klasör, ../../ bir üstü
// VEYA doğrudan projenizin kök dizinindeki bir klasör:
// $baseDir = realpath($_SERVER['DOCUMENT_ROOT'] . '/tools');
// Bu örnek için, script'in bulunduğu yerden bir üst dizindeki 'tools' klasörünü kullanalım:

$documentRoot = $_SERVER['DOCUMENT_ROOT']; // Genellikle /home/username/public_html veya benzeri
$projectRootRelativeToDocumentRoot = ''; // Eğer siteniz ana dizinde değilse burayı ayarlayın, örn: /projem

// Taranacak ana klasör (JS tarafındaki FILE_BROWSER_BASE_PATH ile tutarlı olmalı ama bu sunucu tarafı yoludur)
// Bu yolun, web sunucusunun erişimine açık ve güvenli olduğundan emin olun.
// ASLA web kök dizininin tamamını veya hassas sistem dosyalarını ifşa ETMEYİN.
$scanBaseDirectory = 'tools'; // Web kök dizininize göre 'tools' klasörü

$baseDir = realpath($documentRoot . $projectRootRelativeToDocumentRoot . '/' . $scanBaseDirectory);

if (!$baseDir) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Temel tarama dizini (' . $scanBaseDirectory . ') sunucuda bulunamadı veya geçerli değil. Lütfen list_files.php içindeki yolu kontrol edin."]);
    exit;
}

$path = isset($_GET['path']) ? trim($_GET['path'], "/\\") : '';
$currentDir = realpath($baseDir . '/' . $path);

// Güvenlik: Kullanıcının baseDir dışına çıkmasını engelle
if (!$currentDir || strpos($currentDir, $baseDir) !== 0) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Geçersiz yol veya erişim engellendi.", "requested_path" => $path, "base_dir_check" => $baseDir, "current_dir_check" => $currentDir]);
    exit;
}

$files = [];
$directories = [];

try {
    $items = scandir($currentDir);
    if ($items === false) {
        throw new Exception("Klasör okunamadı.");
    }

    foreach ($items as $item) {
        if ($item === '.' || $item === '..') {
            continue;
        }

        $itemPath = $currentDir . '/' . $item;
        $relativePath = trim($path . '/' . $item, '/'); // JS'e gönderilecek base path'e göreceli yol

        if (is_dir($itemPath)) {
            $directories[] = [
                "name" => $item,
                "type" => "directory",
                "path" => $relativePath
            ];
        } else {
            // Sadece belirli dosya türlerini listelemek isteyebilirsiniz
            // Örneğin: $allowedExtensions = ['html', 'htm', 'php', 'txt', 'jpg', 'png'];
            // $ext = pathinfo($item, PATHINFO_EXTENSION);
            // if (in_array(strtolower($ext), $allowedExtensions)) {
            $files[] = [
                "name" => $item,
                "type" => "file",
                "path" => $relativePath
            ];
            // }
        }
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Dosyalar listelenirken sunucu hatası: " . $e->getMessage()]);
    exit;
}

// Önce klasörleri, sonra dosyaları alfabetik olarak sırala
usort($directories, function($a, $b) { return strcasecmp($a['name'], $b['name']); });
usort($files, function($a, $b) { return strcasecmp($a['name'], $b['name']); });

$data = array_merge($directories, $files);

echo json_encode(["success" => true, "data" => $data, "current_server_path" => $currentDir, "base_server_path" => $baseDir]);

?> 