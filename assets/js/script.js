async function fetchGitHubRepos() {
    const username = 'kmzk-dev';
    const repoContainer = document.getElementById('github-repos');
    const apiUrl = `https://api.github.com/users/${username}/repos?sort=updated&per_page=3`;

    repoContainer.innerHTML = `
        <div class="col-12 loading-placeholder">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="ms-3 text-muted">GitHubリポジトリ情報を読み込み中...</p>
        </div>`;

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
                </div>`;
            repoContainer.insertAdjacentHTML('beforeend', cardHtml);
        });

    } catch (error) {
        console.error("GitHubリポジトリの取得中にエラーが発生しました:", error);
        repoContainer.innerHTML = `
            <div class="col-12 alert alert-danger">
                GitHubリポジトリの読み込みに失敗しました。ユーザー名(${username})を確認するか、API制限をご確認ください。
            </div>`;
    }
}

async function updateServiceStatus() {
    const apiUrl = 'https://fillmee.bambina.jp/api/from-githubpages/service-status-api.php';
    const activeElements = document.querySelectorAll('.js-control-service-active');
    const inactiveElements = document.querySelectorAll('.js-control-service-inactive');
    const spotLink = document.getElementById('coconala-spot-link');
    const focusLink = document.getElementById('coconala-focus-link');

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }
        const data = await response.json();

        if (data.service === true) {
            activeElements.forEach(el => el.style.display = '');
            inactiveElements.forEach(el => el.style.display = 'none');
            if (spotLink && data.content && data.content[0]) {
                spotLink.href = data.content[0];
            }
            if (focusLink && data.content && data.content[1]) {
                focusLink.href = data.content[1];
            }
        } else {
            activeElements.forEach(el => el.style.display = 'none');
            inactiveElements.forEach(el => el.style.display = '');
        }
    } catch (error) {
        console.error("サービス受付状況の取得中にエラーが発生しました:", error);
        activeElements.forEach(el => el.style.display = 'none');
        inactiveElements.forEach(el => el.style.display = '');
    }
}

const consentCheckbox = document.getElementById('privacyConsent');
const formInputs = document.querySelectorAll('#contact-form [required]');
const recaptchaWrapper = document.getElementById('recaptcha-wrapper');
const contactForm = document.getElementById('contact-form');
const emailInput = document.getElementById('inputEmail');
let isRecaptchaVerified = false;

const FREE_EMAIL_DOMAINS = [
    'gmail.com', 'yahoo.co.jp', 'hotmail.com',
    'outlook.com', 'icloud.com', 'live.jp', 'live.com'
];

function isFreeEmail(email) {
    if (!email) return false;
    const domain = email.split('@').pop().toLowerCase();
    return FREE_EMAIL_DOMAINS.includes(domain);
}

function checkAllInputsFilled() {
    return Array.from(formInputs).every(input => input.value && input.value.trim() !== "");
}

function updateInputState() {
    const consentGiven = consentCheckbox.checked;
    
    document.querySelectorAll('.js-conditional-input').forEach(input => {
        if (input.tagName !== 'BUTTON') {
            input.disabled = !consentGiven;
        }
    });

    const allInputsFilled = checkAllInputsFilled();
    const isEmailValid = emailInput && !emailInput.classList.contains('is-invalid');

    if (recaptchaWrapper) {
        const shouldEnableRecaptcha = consentGiven && allInputsFilled && isEmailValid;
        recaptchaWrapper.style.opacity = shouldEnableRecaptcha ? 1.0 : 0.5;
        recaptchaWrapper.style.pointerEvents = shouldEnableRecaptcha ? 'auto' : 'none';

        if (!shouldEnableRecaptcha && isRecaptchaVerified && typeof grecaptcha !== 'undefined') {
            grecaptcha.reset();
            window.disableForm();
        }
    }
}

window.enableForm = function() {
    isRecaptchaVerified = true;
    const submitButton = contactForm.querySelector('button[type="submit"]');
    if (submitButton && checkAllInputsFilled() && !emailInput.classList.contains('is-invalid')) {
        submitButton.removeAttribute('disabled');
    }
}

window.disableForm = function() {
    isRecaptchaVerified = false;
    const submitButton = contactForm.querySelector('button[type="submit"]');
    if (submitButton) {
        submitButton.setAttribute('disabled', 'disabled');
    }
}

function showToast(isSuccess, message) {
    const toastElement = document.getElementById('contactToast');
    const toast = new bootstrap.Toast(toastElement);
    const icon = document.getElementById('toastIcon');
    const title = document.getElementById('toastTitle');
    const body = document.getElementById('toastBody');

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

function clearForm(form) {
    form.reset();
    window.disableForm();
    if (typeof grecaptcha !== 'undefined') {
        grecaptcha.reset();
    }
    consentCheckbox.checked = false;
    emailInput.classList.remove('is-invalid');
    updateInputState();
}

async function handleFormSubmit(event) {
    event.preventDefault();

    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');

    if (isFreeEmail(emailInput.value)) {
        showToast(false, 'フリーメールアドレスはご利用いただけません。');
        return;
    }

    if (!isRecaptchaVerified) {
        showToast(false, 'ロボット検証（reCAPTCHA）を完了してください。');
        return;
    }

    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> 送信中...';

    const formData = new FormData(form);

    try {
        const response = await fetch(form.action, {
            method: 'POST',
            body: formData,
        });

        const result = await response.json();

        if (response.ok && result.success) {
            showToast(true, 'お問い合わせ内容を正常に送信しました。ありがとうございました！');
            clearForm(form);
        } else {
            const errorMessage = result.message || `サーバーエラー (HTTP ${response.status})。`;
            showToast(false, `エラー: ${errorMessage}`);
        }

    } catch (error) {
        console.error('Fetch Error:', error);
        showToast(false, '通信エラーが発生しました。ネットワークまたはサーバーログを確認してください。');
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = '<i class="bi bi-send-fill me-2"></i> 送信';
        updateInputState();
    }
}

document.addEventListener('DOMContentLoaded', function() {
    fetchGitHubRepos();
    updateServiceStatus();

    if (contactForm) {
        updateInputState();

        consentCheckbox.addEventListener('change', updateInputState);
        formInputs.forEach(input => {
            input.addEventListener('input', updateInputState);
            input.addEventListener('change', updateInputState);
        });

        const originalFeedback = '有効なメールアドレスを入力してください。';
        const feedbackDiv = emailInput.nextElementSibling;

        emailInput.addEventListener('input', () => {
            if (isFreeEmail(emailInput.value)) {
                emailInput.classList.add('is-invalid');
                if (feedbackDiv) {
                    feedbackDiv.textContent = 'フリーメールアドレスはご利用いただけません。組織のメールアドレスをご利用ください。';
                }
            } else {
                emailInput.classList.remove('is-invalid');
                if (feedbackDiv) {
                    feedbackDiv.textContent = originalFeedback;
                }
            }
            // reCAPTCHAの有効/無効を再評価
            updateInputState();
        });

        contactForm.addEventListener('submit', handleFormSubmit);
    }
});