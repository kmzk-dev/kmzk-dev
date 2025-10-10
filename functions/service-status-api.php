<?php
set_time_limit(30);
require_once __DIR__ . '/origin.php'; 
//header('Access-Control-Allow-Origin: *'); 
header('Content-Type: application/json');

$service_status = [
    'service' => true,
    'content' => [
        'https://coconala.com/services/XXXXXX', // ここにココナラのスポットプランURL
        'https://coconala.com/services/YYYYYY'  // ここにココナラのフォーカスプランURL
    ]
];

echo json_encode($service_status);
?>