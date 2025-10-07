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

// --- DOMコンテンツが完全にロードされた後に実行 ---
document.addEventListener('DOMContentLoaded', function () {
    // 1. GitHubリポジトリの動的取得を実行
    fetchGitHubRepos();
});
