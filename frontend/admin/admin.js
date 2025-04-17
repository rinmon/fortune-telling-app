/**
 * 算命学占い管理パネル
 * 管理者ログイン、設定管理、統計表示機能を提供
 */

// デバッグ用のダミー認証情報（実際のアプリでは安全な認証方法を実装すること）
const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'admin123'
};

// 全体で使用するグローバル変数
let usageChart = null;
let siteSettings = {
    siteTitle: '算命学占い',
    resultsToKeep: 20,
    showAllThemes: true,
    enableAnimations: true
};

// ページ読み込み後の初期化
document.addEventListener('DOMContentLoaded', () => {
    // ログイン処理の初期化
    initLoginSystem();
    
    // タブ切り替え機能の初期化
    initTabs();
    
    // ローカルストレージから設定を読み込む
    loadSettings();
    
    // 設定フォームの初期化
    initSettingsForm();
    
    // データ管理機能の初期化
    initDataManagement();
});

/**
 * ログインシステムの初期化
 */
function initLoginSystem() {
    const loginButton = document.getElementById('login-button');
    const logoutButton = document.getElementById('logout-button');
    const loginArea = document.getElementById('login-area');
    const adminDashboard = document.getElementById('admin-dashboard');
    const loginError = document.getElementById('login-error');
    
    // 既存のセッションがあるか確認
    if (isLoggedIn()) {
        showDashboard();
        loadStatistics(); // ログイン済みの場合は統計データを読み込む
    }
    
    // ログインボタンのイベントリスナー
    loginButton.addEventListener('click', () => {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        if (authenticate(username, password)) {
            // ログイン成功
            setLoggedIn(true);
            showDashboard();
            loadStatistics();
            loginError.textContent = '';
        } else {
            // ログイン失敗
            loginError.textContent = 'ユーザー名またはパスワードが正しくありません。';
        }
    });
    
    // ログアウトボタンのイベントリスナー
    logoutButton.addEventListener('click', () => {
        setLoggedIn(false);
        showLoginForm();
    });
    
    // ダッシュボードを表示
    function showDashboard() {
        loginArea.style.display = 'none';
        adminDashboard.style.display = 'block';
    }
    
    // ログインフォームを表示
    function showLoginForm() {
        loginArea.style.display = 'block';
        adminDashboard.style.display = 'none';
        // フォームをクリア
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
    }
}

/**
 * ユーザー認証を行う関数
 * @param {string} username - ユーザー名
 * @param {string} password - パスワード
 * @returns {boolean} - 認証成功ならtrue
 */
function authenticate(username, password) {
    // デモ用の簡易認証（実際のアプリでは安全な認証方法を実装すること）
    return username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password;
}

/**
 * ログイン状態を確認
 * @returns {boolean} - ログイン済みならtrue
 */
function isLoggedIn() {
    return localStorage.getItem('adminLoggedIn') === 'true';
}

/**
 * ログイン状態をセット
 * @param {boolean} status - ログイン状態
 */
function setLoggedIn(status) {
    localStorage.setItem('adminLoggedIn', status);
}

/**
 * タブ切り替え機能の初期化
 */
function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            
            // タブボタンのアクティブ状態を切り替え
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // タブコンテンツの表示を切り替え
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `${tabId}-tab`) {
                    content.classList.add('active');
                }
            });
        });
    });
}

/**
 * 統計データの読み込みと表示
 */
function loadStatistics() {
    // ローカルストレージから統計データを取得
    try {
        // 利用回数カウンターの取得
        let usageCount = JSON.parse(localStorage.getItem('usageCount')) || {
            total: 0,
            today: 0,
            dates: {}
        };
        
        // 今日の日付
        const today = new Date().toISOString().split('T')[0];
        
        // 保存されている占い結果を取得
        const fortuneResults = JSON.parse(localStorage.getItem('fortuneResults')) || [];
        
        // 統計カードの更新
        document.getElementById('total-uses').textContent = usageCount.total || 0;
        document.getElementById('today-uses').textContent = usageCount.dates[today] || 0;
        
        // ユニークユーザー数の計算（簡易的にローカルストレージのユーザーIDで判断）
        const uniqueIds = new Set();
        fortuneResults.forEach(result => {
            if (result.userId) uniqueIds.add(result.userId);
        });
        document.getElementById('unique-users').textContent = uniqueIds.size || 0;
        
        // 占いタイプ別の集計
        const typeStats = {
            'basic': 0,
            'time-fortune': 0
        };
        
        fortuneResults.forEach(result => {
            if (result.type) {
                typeStats[result.type] = (typeStats[result.type] || 0) + 1;
            }
        });
        
        // テーブルの更新
        const tableBody = document.querySelector('#fortune-type-table tbody');
        tableBody.innerHTML = '';
        
        const total = Object.values(typeStats).reduce((sum, count) => sum + count, 0);
        
        Object.entries(typeStats).forEach(([type, count]) => {
            const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
            const row = document.createElement('tr');
            
            const typeName = type === 'basic' ? '基本占い' : 
                            type === 'time-fortune' ? '時間運占い' : type;
            
            row.innerHTML = `
                <td>${typeName}</td>
                <td>${count}</td>
                <td>${percentage}%</td>
            `;
            tableBody.appendChild(row);
        });
        
        // 使用履歴グラフの描画
        drawUsageChart(usageCount.dates);
        
    } catch (error) {
        console.error('統計データの読み込みエラー:', error);
    }
}

/**
 * 使用履歴グラフの描画
 * @param {Object} datesData - 日付ごとの使用回数データ
 */
function drawUsageChart(datesData) {
    const ctx = document.getElementById('usageChart').getContext('2d');
    
    // 最近30日間のデータを準備
    const last30Days = [];
    const counts = [];
    
    // 今日から30日前までの日付を生成
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateString = date.toISOString().split('T')[0];
        last30Days.push(dateString);
        counts.push(datesData[dateString] || 0);
    }
    
    // 既存のチャートがあれば破棄
    if (usageChart) {
        usageChart.destroy();
    }
    
    // 新しいチャートを作成
    usageChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: last30Days,
            datasets: [{
                label: '使用回数',
                data: counts,
                backgroundColor: 'rgba(52, 95, 215, 0.1)',
                borderColor: 'rgba(52, 95, 215, 1)',
                borderWidth: 2,
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 10,
                    right: 10,
                    bottom: 10,
                    left: 10
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        title: function(tooltipItems) {
                            const date = new Date(tooltipItems[0].label);
                            return date.toLocaleDateString('ja-JP');
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45,
                        callback: function(value, index) {
                            // 日付を短い形式で表示（データ量が多いため）
                            const date = new Date(this.getLabelForValue(value));
                            return (index % 5 === 0) ? 
                                `${date.getMonth() + 1}/${date.getDate()}` : '';
                        }
                    },
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    suggestedMax: 10, // デフォルトの最大値を設定
                    ticks: {
                        precision: 0,
                        stepSize: 1,  // 目盤の間隔を整数に
                        maxTicksLimit: 10 // 目盤の最大数
                    }
                }
            }
        }
    });
}

/**
 * 設定のロード
 */
function loadSettings() {
    try {
        const savedSettings = JSON.parse(localStorage.getItem('siteSettings'));
        if (savedSettings) {
            siteSettings = {...siteSettings, ...savedSettings};
        }
    } catch (error) {
        console.error('設定の読み込みエラー:', error);
    }
}

/**
 * 設定フォームの初期化
 */
function initSettingsForm() {
    const settingsForm = document.getElementById('settings-form');
    const siteTitle = document.getElementById('site-title');
    const resultsToKeep = document.getElementById('results-to-keep');
    const showAllThemes = document.getElementById('show-all-themes');
    const enableAnimations = document.getElementById('enable-animations');
    const settingsMessage = document.getElementById('settings-message');
    
    // フォームに現在の設定を反映
    siteTitle.value = siteSettings.siteTitle;
    resultsToKeep.value = siteSettings.resultsToKeep;
    showAllThemes.checked = siteSettings.showAllThemes;
    enableAnimations.checked = siteSettings.enableAnimations;
    
    // フォーム送信イベント
    settingsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // 設定を更新
        siteSettings.siteTitle = siteTitle.value;
        siteSettings.resultsToKeep = parseInt(resultsToKeep.value);
        siteSettings.showAllThemes = showAllThemes.checked;
        siteSettings.enableAnimations = enableAnimations.checked;
        
        // 設定を保存
        localStorage.setItem('siteSettings', JSON.stringify(siteSettings));
        
        // 成功メッセージを表示
        settingsMessage.innerHTML = '<div class="success-message">設定が保存されました。</div>';
        
        // 3秒後にメッセージを消去
        setTimeout(() => {
            settingsMessage.innerHTML = '';
        }, 3000);
    });
}

/**
 * データ管理機能の初期化
 */
function initDataManagement() {
    const exportButton = document.getElementById('export-data');
    const importTrigger = document.getElementById('import-trigger');
    const importFile = document.getElementById('import-file');
    const fileName = document.getElementById('file-name');
    const importButton = document.getElementById('import-data');
    const resetButton = document.getElementById('reset-data');
    
    // エクスポートボタンのイベントリスナー
    exportButton.addEventListener('click', exportData);
    
    // インポートファイル選択トリガー
    importTrigger.addEventListener('click', () => {
        importFile.click();
    });
    
    // ファイル選択時の処理
    importFile.addEventListener('change', () => {
        if (importFile.files.length > 0) {
            fileName.textContent = importFile.files[0].name;
            importButton.disabled = false;
        } else {
            fileName.textContent = '';
            importButton.disabled = true;
        }
    });
    
    // インポートボタンのイベントリスナー
    importButton.addEventListener('click', () => {
        if (importFile.files.length > 0) {
            importData(importFile.files[0]);
        }
    });
    
    // リセットボタンのイベントリスナー
    resetButton.addEventListener('click', () => {
        if (confirm('すべての占い結果データを削除します。この操作は元に戻せません。続行しますか？')) {
            resetData();
        }
    });
}

/**
 * データのエクスポート
 */
function exportData() {
    try {
        // ローカルストレージからデータを取得
        const fortuneResults = JSON.parse(localStorage.getItem('fortuneResults')) || [];
        
        // ダウンロード用のJSONデータを作成
        const dataStr = JSON.stringify({
            fortuneResults: fortuneResults,
            version: '1.0',
            exportDate: new Date().toISOString()
        });
        
        // データをBlobに変換
        const blob = new Blob([dataStr], {type: 'application/json'});
        
        // ダウンロードリンクを作成
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `算命学占いデータ_${new Date().toISOString().split('T')[0]}.json`;
        
        // リンクをクリックしてダウンロードを開始
        document.body.appendChild(a);
        a.click();
        
        // クリーンアップ
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
        
    } catch (error) {
        console.error('データのエクスポートエラー:', error);
        alert('データのエクスポート中にエラーが発生しました。');
    }
}

/**
 * データのインポート
 * @param {File} file - インポートするJSONファイル
 */
function importData(file) {
    const reader = new FileReader();
    
    reader.onload = (e) => {
        try {
            // ファイルの内容をJSONとしてパース
            const importedData = JSON.parse(e.target.result);
            
            // データの検証
            if (!importedData.fortuneResults || !Array.isArray(importedData.fortuneResults)) {
                throw new Error('無効なデータ形式です。');
            }
            
            // ローカルストレージにデータを保存
            localStorage.setItem('fortuneResults', JSON.stringify(importedData.fortuneResults));
            
            // 成功メッセージ
            alert(`${importedData.fortuneResults.length}件のデータをインポートしました。`);
            
            // ファイル選択をリセット
            document.getElementById('import-file').value = '';
            document.getElementById('file-name').textContent = '';
            document.getElementById('import-data').disabled = true;
            
            // 統計を更新
            loadStatistics();
            
        } catch (error) {
            console.error('データのインポートエラー:', error);
            alert('データのインポート中にエラーが発生しました。有効なJSONファイルかどうか確認してください。');
        }
    };
    
    reader.onerror = () => {
        alert('ファイルの読み込み中にエラーが発生しました。');
    };
    
    // ファイルをテキストとして読み込み
    reader.readAsText(file);
}

/**
 * データのリセット
 */
function resetData() {
    try {
        // 占い結果データを削除
        localStorage.removeItem('fortuneResults');
        
        // 成功メッセージ
        alert('すべてのデータが削除されました。');
        
        // 統計を更新
        loadStatistics();
        
    } catch (error) {
        console.error('データのリセットエラー:', error);
        alert('データのリセット中にエラーが発生しました。');
    }
}

/**
 * 使用カウントの更新
 * この関数は実際にはメインページの占い実行時に呼び出される
 */
function updateUsageCount() {
    try {
        // 現在の使用カウントを取得
        let usageCount = JSON.parse(localStorage.getItem('usageCount')) || {
            total: 0,
            today: 0,
            dates: {}
        };
        
        // 今日の日付
        const today = new Date().toISOString().split('T')[0];
        
        // カウントを更新
        usageCount.total++;
        usageCount.dates[today] = (usageCount.dates[today] || 0) + 1;
        
        // 保存
        localStorage.setItem('usageCount', JSON.stringify(usageCount));
        
    } catch (error) {
        console.error('使用カウントの更新エラー:', error);
    }
}
