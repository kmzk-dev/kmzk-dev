// GitHub APIからリポジトリ情報を取得し、動的にカードを生成する関数
async function fetchGitHubRepos() {
    // ユーザー名をkmzk-devに固定
    const username = 'kmzk-dev'; 
    const repoContainer = document.getElementById('github-repos');
    const apiUrl = `https://api.github.com/users/${username}/repos?sort=updated&per_page=3`;
    
    // ローディング表示
    repoContainer.innerHTML = `
        <div class="col-12 loading-placeholder">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="ms-3 text-muted">GitHubリポジトリ情報を読み込み中...</p>
        </div>
    `;

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`GitHub API Error: ${response.statusText}`);
        }
        const repos = await response.json();
        repoContainer.innerHTML = ''; 

        if (repos.length === 0) {
            repoContainer.innerHTML = '<div class="col-12 text-center text-muted">まだ公開リポジトリがありません。</div>';
            return;
        }

        // リポジトリ情報をカードとして表示
        repos.forEach(repo => {
            const description = repo.description || 'このリポジトリには説明がありません。';
            const language = repo.language || 'N/A';
            const stars = repo.stargazers_count || 0;
            
            const cardHtml = `
                <div class="col">
                    <div class="card github-card h-100 p-3">
                        <div class="card-body">
                            <h5 class="card-title fw-bold text-primary">${repo.name}</h5>
                            <h6 class="card-subtitle mb-2 text-muted small">
                                <i class="bi bi-code-slash me-1"></i> ${language} | 
                                <i class="bi bi-star-fill text-warning me-1"></i> ${stars} stars
                            </h6>
                            <p class="card-text text-muted small">${description}</p>
                        </div>
                        <div class="card-footer bg-white border-0 pt-0">
                            <a href="${repo.html_url}" target="_blank" class="btn btn-outline-dark btn-sm">
                                GitHubで見る <i class="bi bi-box-arrow-up-right"></i>
                            </a>
                        </div>
                    </div>
                </div>
            `;
            repoContainer.insertAdjacentHTML('beforeend', cardHtml);
        });

    } catch (error) {
        console.error("GitHubリポジトリの取得中にエラーが発生しました:", error);
        repoContainer.innerHTML = `
            <div class="col-12 alert alert-danger">
                GitHubリポジトリの読み込みに失敗しました。ユーザー名(${username})を確認するか、API制限をご確認ください。
            </div>
        `;
    }
}

// ===========================================
// フォーム制御ロジック (reCAPTCHA対応)
// ===========================================

const consentCheckbox = document.getElementById('privacyConsent');
const controlledInputs = document.querySelectorAll('.js-conditional-input'); 

// reCAPTCHAの状態を保持するフラグ
let isRecaptchaVerified = false; 

// フォームの入力状態を更新する関数
function updateInputState() {
    // 同意チェックとreCAPTCHAが両方完了した場合のみ有効化
    const enableForm = consentCheckbox.checked && isRecaptchaVerified;

    controlledInputs.forEach(input => {
        if (enableForm) {
            input.removeAttribute('disabled');
        } else {
            input.setAttribute('disabled', 'disabled');
        }
    });
}

// reCAPTCHA成功時に呼び出されるグローバル関数 (data-callbackで指定)
window.enableForm = function() {
    isRecaptchaVerified = true;
    updateInputState();
}

// reCAPTCHA期限切れ時に呼び出されるグローバル関数 (data-expired-callbackで指定)
window.disableForm = function() {
    isRecaptchaVerified = false;
    updateInputState();
}

// ===========================================
// ★★★ 非同期フォーム送信とトースト表示のロジック ★★★
// ===========================================

// トーストを表示する関数
function showToast(isSuccess, message) {
    const toastElement = document.getElementById('contactToast');
    // BootstrapのToastインスタンスを再生成
    const toast = new bootstrap.Toast(toastElement);

    const icon = document.getElementById('toastIcon');
    const title = document.getElementById('toastTitle');
    const body = document.getElementById('toastBody');
    
    // クラスをリセット
    toastElement.classList.remove('text-bg-success', 'text-bg-danger');
    icon.className = 'bi me-2';

    if (isSuccess) {
        toastElement.classList.add('text-bg-success');
        icon.classList.add('bi-check-circle-fill');
        title.textContent = '送信成功';
    } else {
        toastElement.classList.add('text-bg-danger');
        icon.classList.add('bi-x-octagon-fill');
        title.textContent = '送信失敗';
    }
    
    body.textContent = message;
    toast.show();
}

// フォームの内容をクリアする関数
function clearForm(form) {
    form.reset();
    // フォームを無効化状態に戻す
    window.disableForm();
    // reCAPTCHAウィジェットをリセット
    if (typeof grecaptcha !== 'undefined') {
        grecaptcha.reset();
    }
    // 同意チェックボックスの状態をリセット
    consentCheckbox.checked = false;
}

// フォームの非同期送信処理
async function handleFormSubmit(event) {
    event.preventDefault(); // デフォルトのフォーム送信を阻止
    
    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');

    // 送信ボタンのローディング状態
    if (submitButton) {
        submitButton.setAttribute('disabled', 'disabled');
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> 送信中...';
    }

    const formData = new FormData(form);
    
    try {
        const response = await fetch(form.action, {
            method: 'POST',
            body: formData,
        });

        // サーバーが200 OK以外のHTTPステータスコードを返しても、JSONボディを読み込む
        // PHPが返す {success: false, message: "..."} を確実に取得するため
        const result = await response.json(); 

        // HTTPステータスが正常範囲内 (2xx) で、かつ JSONの success: true の場合
        if (response.ok && result.success) {
            showToast(true, 'お問い合わせ内容を正常に送信しました。ありがとうございました！');
            clearForm(form); // 成功時にフォームをクリア
        } 
        // HTTPステータスがエラー (4xx/5xx) の場合、または JSONの success: false の場合
        else { 
            // result.message に具体的なエラーメッセージが含まれていることを期待
            const errorMessage = result.message || `サーバーエラー (HTTP ${response.status})。サーバーログを確認してください。`;
            showToast(false, `エラー: ${errorMessage}`);
        }

    } catch (error) {
        console.error('Fetch Error:', error);
        // ネットワーク通信自体が失敗した場合（CORSエラー、サーバーダウンなど）
        showToast(false, '通信エラーが発生しました。ネットワークまたはサーバーログを確認してください。');
        
    } finally {
        // 送信ボタンの状態を元に戻す
        if (submitButton) {
            submitButton.removeAttribute('disabled');
            submitButton.innerHTML = '<i class="bi bi-send-fill me-2"></i> 送信';
            // reCAPTCHAで有効化された状態が継続している場合は、再度有効にする
            updateInputState();
        }
    }
}
// --- DOMコンテンツが完全にロードされた後に実行 ---
document.addEventListener('DOMContentLoaded', function () {
    // 1. GitHubリポジトリの動的取得を実行
    fetchGitHubRepos();
    
    // 2. フォームの有効化制御を初期化
    if (consentCheckbox) {
        updateInputState();
        consentCheckbox.addEventListener('change', updateInputState);
    }

    // 3. フォーム送信イベントを設定
    const contactForm = document.getElementById('contact-form'); 
    
    if (contactForm) {
        contactForm.addEventListener('submit', handleFormSubmit);
    }
});