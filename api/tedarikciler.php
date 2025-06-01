<?php
// ob_start(); 
// ini_set('display_errors', 1);
// ini_set('display_startup_errors', 1);
// error_reporting(E_ALL);

// require_once '../config/db_config.php'; 

// header("Access-Control-Allow-Origin: *");
// header("Content-Type: application/json; charset=UTF-8");
// header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
// header("Access-Control-Max-Age: 3600");
// header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
//    http_response_code(200);
//    exit();
// }
// ob_clean(); 
echo json_encode(array("message" => "PHP test from tedarikciler.php", "status" => "ok"));
// $conn->close(); 
?> 