<?php
set_time_limit(30);
require_once __DIR__ . '/secrets.php'; 

// ----------------------------------------------------

// アクセス確認
//if (!isset($_SERVER['HTTP_ORIGIN']) || $_SERVER['HTTP_ORIGIN'] !== ALLOWED_ORIGIN) {
//    http_response_code(403);
//    echo json_encode(['success' => false, 'message' => 'Origin not allowed.']);
//    exit;
//}
//header('Access-Control-Allow-Origin: ' . ALLOWED_ORIGIN);
header('Access-Control-Allow-Origin: * ');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
    exit;
}

// reCAPTCHA検証
$recaptcha_response = $_POST['g-recaptcha-response'] ?? '';

if (empty($recaptcha_response)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'reCAPTCHA response is missing.']);
    exit;
}

$verify_url = 'https://www.google.com/recaptcha/api/siteverify';
$data = [
    'secret' => RECAPTCHA_SECRET,
    'response' => $recaptcha_response,
    'remoteip' => $_SERVER['REMOTE_ADDR']
];

$ch = curl_init($verify_url);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
// サーバー別考慮:HTTPS通信を確実にするため、CA証明書検証を無効化する:コメントアウトで動作確認すること
// curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
$response_json = curl_exec($ch);
curl_close($ch);

$response_data = json_decode($response_json, true);

if (!$response_data['success']) {
    http_response_code(400);
    error_log("reCAPTCHA verification failed. Errors: " . implode(', ', $response_data['error-codes'] ?? ['Unknown error']));
    echo json_encode(['success' => false, 'message' => 'Robot verification failed. Please try again.']);
    exit;
}

// 必須フィールドの検証
$required_fields = ['inputName', 'inputEmail', 'inputSubject', 'inputMessage'];
foreach ($required_fields as $field) {
    if (empty(trim($_POST[$field]))) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Missing required field: ' . $field]);
        exit;
    }
}

// 投稿フィードの形成
$name = filter_var(trim($_POST['inputName']), FILTER_SANITIZE_SPECIAL_CHARS);
$company = filter_var(trim($_POST['inputCompany']), FILTER_SANITIZE_SPECIAL_CHARS);
$email = filter_var(trim($_POST['inputEmail']), FILTER_SANITIZE_EMAIL);
$subject = filter_var(trim($_POST['inputSubject']), FILTER_SANITIZE_SPECIAL_CHARS);

// 改行文字化け対策（strip_tags, htmlspecialcharsでサニタイズ）
$raw_message = trim($_POST['inputMessage']);
$clean_message = strip_tags($raw_message);
$escaped_message = htmlspecialchars($clean_message, ENT_QUOTES, 'UTF-8');
$message = str_replace(array("\r\n", "\r", "\n"), "\n", $escaped_message);

// メールアドレスの形式検証
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid email format.']);
    exit;
}

// メール本文構築
$email_subject = "[問い合わせ-DEV.FILLMEE] " . $subject;
$email_body = "【お問い合わせ元情報】\n";
$email_body .= "お名前: " . $name . "\n";
$email_body .= "会社名: " . ($company ?: 'なし') . "\n";
$email_body .= "メールアドレス: " . $email . "\n";
$email_body .= "--------------------------------------\n";
$email_body .= "【件名】\n" . $subject . "\n";
$email_body .= "--------------------------------------\n";
$email_body .= "【お問い合わせ内容】\n" . $message . "\n";
$email_body .= "--------------------------------------\n";
$email_body .= "送信元IPアドレス: " . $_SERVER['REMOTE_ADDR'] . "\n";
$email_body .= "\n\n--------------------------------------\n";
$email_body .= "このメールは DEV.FILLMEE.COM のウェブサイトから送信されました。\n";
$email_body .= "WebサイトURL: https://dev.fillmee.com\n";
$email_body .= "運営者: kmzk-dev\n";

$headers = "From: <" . SENDER_EMAIL . ">\r\n";
$headers .= "Reply-To: " . $email . "\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

// メール送信
if (mail(RECIPIENT_EMAIL, $email_subject, $email_body, $headers)) {
    http_response_code(200);
    echo json_encode(['success' => true, 'message' => 'Mail sent successfully.']);
} else {
    error_log("Email sending failed to " . RECIPIENT_EMAIL . " from " . SENDER_EMAIL);
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: Failed to send mail.']);
}
?>