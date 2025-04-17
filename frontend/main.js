// グローバル変数
let currentUser = null; // ユーザー情報を保持
let lastFortuneData = null; // 最後の占い結果

// ページ読み込み時にユーザー初期化を行う
document.addEventListener('DOMContentLoaded', async function() {
    // ユーザー初期化
    await initializeUser();
    
    // ウェルカムバック表示の確認
    checkWelcomeBack();
    
    // ボタンのイベントリスナーを設定
    initWelcomeBackButtons();
    
    // 保存された結果を読み込む
    loadFortuneResults();
});

/**
 * 保存された占い結果を読み込む
 */
function loadFortuneResults() {
    try {
        // ローカルストレージから前回の占い結果を取得
        const savedResult = localStorage.getItem('lastFortuneResult');
        
        if (savedResult) {
            try {
                // JSONにパース
                const fortuneData = JSON.parse(savedResult);
                lastFortuneData = fortuneData;
                
                // ニックネームが存在すれば結果に反映
                const nickname = localStorage.getItem('userNickname');
                if (nickname && fortuneData) {
                    fortuneData.name = nickname;
                }
                
                console.log('前回の占い結果を読み込みました');
                
                // 結果があれば、前回の占いを表示するボタンを有効化
                const prevResultBtn = document.getElementById('show-previous-result');
                if (prevResultBtn) {
                    prevResultBtn.style.display = '';
                    prevResultBtn.addEventListener('click', function() {
                        displayFortuneResult(fortuneData);
                    });
                }
            } catch (parseError) {
                console.error('保存された占い結果のパースエラー:', parseError);
                localStorage.removeItem('lastFortuneResult'); // 不正なデータを削除
            }
        } else {
            console.log('保存された占い結果がありません');
        }
    } catch (error) {
        console.error('占い結果の読み込みエラー:', error);
    }
}

/**
 * ユーザーの初期化を行う
 */
async function initializeUser() {
    try {
        // APIが定義されているか確認
        if (!window.api || typeof window.api.initUser !== 'function') {
            throw new Error('API not available');
        }
        
        // APIからユーザー情報を取得
        const userData = await window.api.initUser();
        
        // 正常にレスポンスを受け取った場合
        if (userData && userData.userId) {
            currentUser = userData;
            console.log('ユーザー初期化成功:', userData.userId);
            
            // オフラインモードの場合の処理
            if (userData.offline) {
                console.log('オフラインモードで動作します');
            }
        } else {
            // レスポンスが不正な場合はオフラインモードに
            throw new Error('Invalid user data');
        }
    } catch (error) {
        // エラーログ出力
        console.error('ユーザー初期化エラー:', error);
        console.log('オフラインモードで動作します');
        
        // オフラインモードとして動作する
        const localUserId = 'offline-' + Date.now();
        currentUser = { 
            userId: localUserId, 
            isNewUser: true, 
            offline: true 
        };
        console.log('ユーザー初期化完了:', localUserId);
    } finally {
        // エラーの有無にかかわらず必ず実行
        checkFirstTimeVisitor();
    }
}

/**
 * 占い結果をローカルストレージに保存する関数
 * @param {Object} data - APIから返された占い結果データ
 * @param {String} birthdate - 生年月日
 * @param {String} gender - 性別
 * @param {String} theme - 占いテーマ
 */
function saveFortuneResult(data, birthdate, gender, theme) {
    // 現在の日時を取得
    const now = new Date();
    const saveDate = now.toISOString();
    const displayDate = now.toLocaleString('ja-JP');
    
    // ユニークIDの生成
    const resultId = 'fortune_' + now.getTime();
    
    // 保存データの作成
    const saveData = {
        id: resultId,
        saveDate: saveDate,
        displayDate: displayDate,
        birthdate: birthdate,
        gender: gender,
        theme: theme,
        result: data
    };
    
    // すでに保存されている結果の取得
    let savedResults = JSON.parse(localStorage.getItem('fortuneResults') || '[]');
    
    // 最新の結果を先頭に追加
    savedResults.unshift(saveData);
    
    // 最大保存数を超えたらデータ削除（目安は20個）
    if (savedResults.length > 20) {
        savedResults = savedResults.slice(0, 20);
    }
    
    // ローカルストレージに保存
    localStorage.setItem('fortuneResults', JSON.stringify(savedResults));
    
    // 印刷用に最新の結果を保存
    localStorage.setItem('lastFortuneResult', JSON.stringify(saveData));
    
    console.log('結果が保存されました:', resultId);
    return resultId;
}

/**
 * 履歴表示と共有ボタンを追加する関数
 * @param {HTMLElement} container - ボタンを追加するコンテナ要素
 * @param {Object} data - 占い結果データ
 */
function addHistoryAndShareButtons(container, data) {
    // ボタンエリアがなければ作成
    let buttonsArea = document.getElementById('fortune-buttons-area');
    if (!buttonsArea) {
        buttonsArea = document.createElement('div');
        buttonsArea.id = 'fortune-buttons-area';
        buttonsArea.className = 'fortune-buttons';
        container.appendChild(buttonsArea);
    } else {
        buttonsArea.innerHTML = ''; // 既存の場合は一度クリア
    }
    
    // 履歴表示ボタン
    const historyButton = document.createElement('button');
    historyButton.className = 'fortune-button history-button';
    historyButton.innerHTML = '過去の占い結果を見る';
    historyButton.addEventListener('click', showFortuneHistory);
    buttonsArea.appendChild(historyButton);
    
    // 印刷ボタン
    const printButton = document.createElement('button');
    printButton.className = 'fortune-button print-button';
    printButton.innerHTML = '結果を印刷する';
    printButton.addEventListener('click', printFortuneResult);
    buttonsArea.appendChild(printButton);
}

/**
 * 履歴モーダルを表示する関数
 */
function showFortuneHistory() {
    // 保存されている占い結果を取得
    const savedResults = JSON.parse(localStorage.getItem('fortuneResults') || '[]');
    
    // 履歴がない場合
    if (savedResults.length === 0) {
        alert('保存された占い結果がありません。');
        return;
    }
    
    // モーダル要素の作成
    const modal = document.createElement('div');
    modal.className = 'fortune-modal';
    modal.innerHTML = `
        <div class="fortune-modal-content">
            <div class="fortune-modal-header">
                <h3>過去の占い結果</h3>
                <span class="close-modal">&times;</span>
            </div>
            <div class="fortune-modal-body">
                <ul class="fortune-history-list"></ul>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // モーダル内の履歴リストエリア
    const historyList = modal.querySelector('.fortune-history-list');
    
    // 各結果をリストに追加
    savedResults.forEach((item, index) => {
        const listItem = document.createElement('li');
        listItem.className = 'fortune-history-item';
        
        // テーマ名を日本語表示に変換
        const themeDisplay = {
            'general': '総合運',
            'love': '恋愛運',
            'work': '仕事運',
            'health': '健康運'
        };
        
        listItem.innerHTML = `
            <div class="history-date">${item.displayDate}</div>
            <div class="history-info">
                <p><strong>生年月日:</strong> ${item.birthdate}</p>
                <p><strong>テーマ:</strong> ${themeDisplay[item.theme] || item.theme}</p>
            </div>
            <button class="view-history-btn" data-id="${item.id}">表示</button>
        `;
        historyList.appendChild(listItem);
        
        // 表示ボタンのイベントリスナー
        listItem.querySelector('.view-history-btn').addEventListener('click', function() {
            loadFortuneResult(item.id);
            closeModal(modal);
        });
    });
    
    // 閉じるボタンのイベント
    modal.querySelector('.close-modal').addEventListener('click', () => closeModal(modal));
    
    // モーダル外クリックで閉じる
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal(modal);
        }
    });
    
    // モーダルを表示
    setTimeout(() => {
        modal.style.opacity = '1';
    }, 10);
}

/**
 * モーダルを閉じる関数
 * @param {HTMLElement} modal - モーダル要素
 */
function closeModal(modal) {
    modal.style.opacity = '0';
    setTimeout(() => {
        document.body.removeChild(modal);
    }, 300);
}

/**
 * 保存された占い結果を読み込む関数
 * @param {String} resultId - 結果ID
 */
function loadFortuneResult(resultId) {
    const savedResults = JSON.parse(localStorage.getItem('fortuneResults') || '[]');
    const result = savedResults.find(item => item.id === resultId);
    
    if (!result) {
        alert('指定された結果が見つかりません。');
        return;
    }
    
    // フォームに値を設定
    document.getElementById('birthdate').value = result.birthdate;
    document.getElementById('gender').value = result.gender;
    document.getElementById('theme').value = result.theme;
    
    // 結果を表示するためにフォーム送信イベントをトリガー
    document.getElementById('fortune-form').requestSubmit();
}

/**
 * 占い結果を印刷する関数
 */
function printFortuneResult() {
    window.print();
}

// 時間運占いボタンのイベントリスナー
document.getElementById('time-fortune-button').addEventListener('click', function() {
    const birthdate = document.getElementById('birthdate').value;
    if (!birthdate) {
        alert('生年月日を入力してください');
        return;
    }
    
    const gender = document.getElementById('gender').value;
    if (!gender) {
        alert('性別を選択してください');
        return;
    }
    
    const timeOption = document.querySelector('input[name="time-fortune"]:checked');
    if (!timeOption) {
        alert('時間運の種類を選択してください');
        return;
    }
    
    calculateTimeFortune(birthdate, gender, timeOption.value);
});

document.getElementById('fortune-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const birthdate = document.getElementById('birthdate').value;
    const gender = document.getElementById('gender').value;
    const theme = document.getElementById('theme').value;
    const resultDiv = document.getElementById('result');
    
    // 使用状況の記録
    updateUsageCount('basic');
    resultDiv.textContent = '占い中...';

    try {
        // ユーザーが初期化されていない場合は初期化する
        if (!currentUser) {
            await initializeUser();
        }
        
        // 占い計算のリクエスト
        const response = await fetch('/api/fortune', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ birthday: birthdate, gender, theme })
        });
        
        if (!response.ok) {
            throw new Error('サーバーエラーが発生しました');
        }
        
        // APIレスポンスを取得
        let data = await response.json();
        
        // ニックネームを結果に反映させる
        data = addNicknameToResult(data);
        // 結果を日本語で整形して表示
        let html = '';
        if (data.error) {
            html = `<span style='color:red;'>${data.error}</span>`;
            if (data.details) html += `<br>${data.details}`;
            document.getElementById('gogyo-chart-area').style.display = 'none';
        } else {
            // ニックネームを先頭に表示
            // 全体で使用するニックネームを取得
            const nickname = data.name || localStorage.getItem('userNickname') || 'お客様';
            html += `<h3>${nickname}さんの占い結果</h3>`;
            html += `<strong>生年月日:</strong> ${data.birthday}<br>`;
            html += `<strong>性別:</strong> ${data.gender === 'male' ? '男性' : data.gender === 'female' ? '女性' : 'その他'}<br><br>`;
            html += `<strong>性格分析:</strong><br>${data.personality.summary.replace(/あなた/g, nickname)}<br>`;
            html += `<ul>`;
            html += `<li>五行バランス: ${data.personality.details.elementBalance}</li>`;
            html += `<li>陰陽: ${data.personality.details.yinYang}</li>`;
            html += `<li>コメント: ${data.personality.details.comment}</li>`;
            html += `</ul>`;

            // --- 五行グラフ描画と解釈 ---
            const gogyoStr = data.personality.details.elementBalance; // 例: "木2・火1・土1・金1・水0"
            const gogyoArr = gogyoStr.match(/木(\d+)・火(\d+)・土(\d+)・金(\d+)・水(\d+)/);
            if (gogyoArr) {
                const gogyoVals = [parseInt(gogyoArr[1]), parseInt(gogyoArr[2]), parseInt(gogyoArr[3]), parseInt(gogyoArr[4]), parseInt(gogyoArr[5])];
                // 五行チャート表示の前に表示設定を先に変更
                document.getElementById('gogyo-chart-area').style.display = '';
                
                // 五行チャートエリアを先に表示状態にする
                const chartArea = document.getElementById('gogyo-chart-area');
                if (chartArea) {
                    chartArea.style.display = '';
                    chartArea.innerHTML = ''; // 内容を空にする

                    // 解釈エリアを先に生成して挿入
                    const gogyoInterpretation = interpretGogyoBalance(gogyoVals);
                    const interpDiv = document.createElement('div');
                    interpDiv.id = 'gogyo-interpretation';
                    interpDiv.className = 'gogyo-interpretation';
                    interpDiv.innerHTML = gogyoInterpretation;
                    chartArea.appendChild(interpDiv);
                    
                    // キャンバスを生成
                    const canvasDiv = document.createElement('div');
                    canvasDiv.id = 'gogyo-chart-container';
                    canvasDiv.style.width = '320px';
                    canvasDiv.style.height = '320px';
                    canvasDiv.style.margin = '0 auto';
                    chartArea.insertBefore(canvasDiv, interpDiv);
                    
                    try {
                        // グラフ描画
                        drawGogyoChart(gogyoVals);
                    } catch (err) {
                        console.error('グラフ描画エラー:', err);
                        canvasDiv.innerHTML = '<div class="error-message" style="color:red;text-align:center;padding:20px">グラフ描画エラーが発生しました</div>';
                    }
                }
            } else {
                document.getElementById('gogyo-chart-area').style.display = 'none';
            }

            html += `<h2>運勢結果</h2>
            <div class="fortune-results-container">`;
            
            // ニックネームは既に取得済み (nickname変数を使用)
            
            if (data.fortune.yearFortune) {
                html += `<div class="fortune-result-item general">
                            <h3>総合運</h3>
                            <p>${data.fortune.yearFortune.replace(/\u3042\u306a\u305f/g, nickname)}</p>
                         </div>`;
            }
            
            if (data.fortune.love) {
                html += `<div class="fortune-result-item love">
                            <h3>恋愛運</h3>
                            <p>${data.fortune.love.replace(/あなた/g, nickname)}</p>
                         </div>`;
            }
            
            if (data.fortune.work) {
                html += `<div class="fortune-result-item work">
                            <h3>仕事運</h3>
                            <p>${data.fortune.work.replace(/あなた/g, nickname)}</p>
                         </div>`;
            }
            
            if (data.fortune.health) {
                html += `<div class="fortune-result-item health">
                            <h3>健康運</h3>
                            <p>${data.fortune.health.replace(/あなた/g, nickname)}</p>
                         </div>`;
            }
            
            html += `</div>`;
        }
        resultDiv.innerHTML = html;

        // --- 人体星図（9マス）描画 ---
        const starChartAreaId = 'star-chart-area';
        let starChartArea = document.getElementById(starChartAreaId);
        if (!starChartArea) {
            starChartArea = document.createElement('div');
            starChartArea.id = starChartAreaId;
            starChartArea.style.marginTop = '30px';
            // gogyo-chart-areaの直後に必たappend（nextSiblingがnullでもOK）
            let gogyoArea = document.getElementById('gogyo-chart-area');
            gogyoArea.parentNode.insertBefore(starChartArea, gogyoArea.nextSibling);
        }
        if (data.bodyStars && Array.isArray(data.bodyStars) && data.bodyStars.length === 9) {
            console.log('bodyStars:', data.bodyStars); // デバッグ用
            renderStarChart(data.bodyStars);
            starChartArea.style.display = '';
            
            // --- 結果をサーバーとローカルストレージに保存 ---
            try {
                // 非同期で結果を保存
                const resultId = await saveFortuneResult(data, birthdate, gender, theme, 'basic');
                console.log('結果を保存しました:', resultId);
            } catch (saveError) {
                console.error('結果の保存に失敗しました:', saveError);
                // 保存エラーは表示せず、結果の表示は続行
            }
            
            // --- 履歴表示と保存ボタンの追加 ---
            addHistoryAndShareButtons(resultDiv, data);
        } else {
            starChartArea.innerHTML = '';
            starChartArea.style.display = 'none';
        }
    } catch (err) {
        resultDiv.textContent = err.message;
    } finally {
        // フォーム値を保持する処理（クリア問題対策）
        setTimeout(() => {
            document.getElementById('birthdate').value = birthdate;
            document.getElementById('gender').value = gender;
            document.getElementById('theme').value = theme;
        }, 100);
    }
});

/**
 * 九宮の位置名と意味を取得
 * @param {number} position - 位置インデックス
 * @return {Object} 位置情報（名称、意味、要素、解説）
 */
function getPositionName(position) {
    const positions = [
        { 
            name: '左上（南西）', 
            meaning: '展望・名声', 
            element: '火', 
            description: '人生の望みや目標を表します。社会的評価や信頭、名声を司る場所です。ここに位置する星はあなたの展望や外部からの評価に影響します。' 
        },
        { 
            name: '上中（南）', 
            meaning: 'キャリア・生業', 
            element: '木', 
            description: 'キャリアや生業・存在意義を表します。社会的な存在としてのアイデンティティに影響する場所です。ここに位置する星はあなたの仕事や社会的成功に影響します。' 
        },
        { 
            name: '右上（南東）', 
            meaning: 'つながり・ネットワーク', 
            element: '土', 
            description: '人間関係やネットワークを表します。社会的なつながりや友人関係、協力者を司る場所です。ここに位置する星はあなたの人間関係の建し方に影響します。' 
        },
        { 
            name: '左中（西）', 
            meaning: '家族・過去', 
            element: '金', 
            description: '家族や過去、伝統を表します。属するコミュニティや迎え入れる価値観・心の安全基地を司る場所です。ここに位置する星はあなたの家族関係や過去との関わり方に影響します。' 
        },
        { 
            name: '中央', 
            meaning: '自己・中心', 
            element: '土', 
            description: '自己の本質やアイデンティティの中心を表します。人格の中核や精神的な中心、意識を司る場所です。ここに位置する星はあなたの本質的な特性や生き方の核心を表します。' 
        },
        { 
            name: '右中（東）', 
            meaning: '未来・変化', 
            element: '水', 
            description: '未来や変化、成長を表します。新たな可能性やチャレンジ、未知の領域を司る場所です。ここに位置する星はあなたの未来志向や変化への適応力に影響します。' 
        },
        { 
            name: '左下（北西）', 
            meaning: '知性・智慧', 
            element: '木', 
            description: '知性や学び、智慧を表します。教育や知的探求、学習を司る場所です。ここに位置する星はあなたの学習能力や知的好奇心、思考法に影響します。' 
        },
        { 
            name: '下中（北）', 
            meaning: '健康・精神', 
            element: '火', 
            description: '健康や精神状態、内面的えりはを表します。身体と心のバランスや自己ケアを司る場所です。ここに位置する星はあなたの健康管理や精神的充実に影響します。' 
        },
        { 
            name: '右下（北東）', 
            meaning: '富・資源', 
            element: '金', 
            description: '資源や資産、物質的価値を表します。財神や金銭、物質的資源を司る場所です。ここに位置する星はあなたの資産形成や物質的安定に影響します。' 
        }
    ];
    
    return (position >= 0 && position < positions.length) ? positions[position] : { name: '不明', meaning: '', element: '', description: '' };
}

/**
 * 星と星の関係（相生・相克）を分析する関数
 * @param {Array} bodyStars - 9つの星の配列
 * @param {Number} position - 分析する星の位置
 * @returns {Object} 相互関係の分析結果
 */
function analyzeStarRelations(bodyStars, position) {
    const relations = [];
    const targetStar = bodyStars[position];
    
    // 星の五行属性マッピング
    const starElements = {
        '貫索星': 'wood',   // 木
        '石門星': 'earth',  // 土
        '鳳閣星': 'earth',  // 土
        '調舒星': 'fire',   // 火
        '禄存星': 'fire',   // 火
        '司禄星': 'earth',  // 土
        '車騎星': 'water',  // 水
        '牽牛星': 'fire',   // 火
        '龍高星': 'wood',   // 木
        '玉堂星': 'metal'   // 金
    };
    
    // 五行の相生・相克関係
    const elementRelations = {
        'wood': { generates: 'fire', controls: 'earth' },
        'fire': { generates: 'earth', controls: 'metal' },
        'earth': { generates: 'metal', controls: 'water' },
        'metal': { generates: 'water', controls: 'wood' },
        'water': { generates: 'wood', controls: 'fire' }
    };
    
    // 距離による関係タイプを定義
    function getRelationType(p1, p2) {
        // 隣接する位置の組み合わせ
        const adjacent = [
            [0, 1], [0, 3], [1, 0], [1, 2], [1, 4], [2, 1], [2, 5],
            [3, 0], [3, 4], [3, 6], [4, 1], [4, 3], [4, 5], [4, 7],
            [5, 2], [5, 4], [5, 8], [6, 3], [6, 7], [7, 4], [7, 6],
            [7, 8], [8, 5], [8, 7]
        ];
        
        // 対角線上の位置の組み合わせ
        const diagonal = [
            [0, 4], [0, 8], [2, 4], [2, 6], [4, 0], [4, 2],
            [4, 6], [4, 8], [6, 2], [6, 4], [8, 0], [8, 4]
        ];
        
        // 一直線上にある位置の組み合わせ（直接隣接しないもの）
        const linear = [
            [0, 2], [2, 0], [0, 6], [6, 0], [2, 8], [8, 2], [6, 8], [8, 6]
        ];
        
        for (const [a, b] of adjacent) {
            if ((p1 === a && p2 === b) || (p1 === b && p2 === a)) {
                return 'adjacent';
            }
        }
        
        for (const [a, b] of diagonal) {
            if ((p1 === a && p2 === b) || (p1 === b && p2 === a)) {
                return 'diagonal';
            }
        }
        
        for (const [a, b] of linear) {
            if ((p1 === a && p2 === b) || (p1 === b && p2 === a)) {
                return 'linear';
            }
        }
        
        return 'distant';
    }
    
    // 中央の星の特別な意味
    const isCenterPosition = position === 4;
    if (isCenterPosition) {
        relations.push({
            type: 'center',
            typeName: '中心性',
            desc: 'あなたの人格の核となる重要な星です。他の星全てに影響を与えます。'
        });
    }
    
    // 各星との関係を分析
    for (let i = 0; i < bodyStars.length; i++) {
        if (i === position) continue; // 自分自身との関係はスキップ
        
        const otherStar = bodyStars[i];
        const relationType = getRelationType(position, i);
        const targetElement = starElements[targetStar] || 'unknown';
        const otherElement = starElements[otherStar] || 'unknown';
        
        // 関係性の判定
        let relationDesc = '';
        let relationClass = '';
        
        // 五行相生相克関係を判定
        if (targetElement !== 'unknown' && otherElement !== 'unknown') {
            if (elementRelations[targetElement].generates === otherElement) {
                relationDesc = `${targetStar}は${otherStar}を生じる相生関係です。相互にプラスの影響を受けます。`;
                relationClass = 'relation-generate';
            } else if (elementRelations[targetElement].controls === otherElement) {
                relationDesc = `${targetStar}は${otherStar}を克する相克関係です。押さえる力がはたらきます。`;
                relationClass = 'relation-control';
            } else if (elementRelations[otherElement].generates === targetElement) {
                relationDesc = `${targetStar}は${otherStar}から生じられる相生関係です。エネルギーを受け取ります。`;
                relationClass = 'relation-generated';
            } else if (elementRelations[otherElement].controls === targetElement) {
                relationDesc = `${targetStar}は${otherStar}に克される相克関係です。押さえられています。`;
                relationClass = 'relation-controlled';
            } else {
                relationDesc = `${targetStar}と${otherStar}は中立的な関係です。ほぼ影響し合いません。`;
                relationClass = 'relation-neutral';
            }
        }
        
        // 位置関係に基づく説明を追加
        let positionDesc = '';
        switch (relationType) {
            case 'adjacent':
                positionDesc = `隔てた位置にあり、直接的な影響を与え合います。`;
                break;
            case 'diagonal':
                positionDesc = `斜め方向に位置し、角度をもった影響を与えます。`;
                break;
            case 'linear':
                positionDesc = `一直線上に位置し、一貫した影響を与えます。`;
                break;
            default:
                positionDesc = `あまり影響し合わない位置です。`;
                break;
        }
        
        // 位置名を取得
        const positionName = getPositionName(i).split(' - ')[0];
        
        // 関係情報を追加
        relations.push({
            star: otherStar,
            position: i,
            positionName: positionName,
            type: relationClass,
            typeName: relationClass === 'relation-generate' ? '相生' : 
                     relationClass === 'relation-control' ? '相克' :
                     relationClass === 'relation-generated' ? '被相生' :
                     relationClass === 'relation-controlled' ? '被相克' : '中立',
            desc: `${positionName}の${otherStar}: ${relationDesc} ${positionDesc}`
        });
    }
    
    // HTML形式の結果生成
    let html = '<ul class="relation-list">';
    relations.forEach(rel => {
        html += `<li class="${rel.type}"><span class="relation-type ${rel.type}">${rel.typeName}</span>: ${rel.desc}</li>`;
    });
    html += '</ul>';
    
    return { relations, html };
}

/**
 * 星図全体のパターンを分析する関数
 * @param {Array} bodyStars - 9つの星の配列
 * @returns {Object} パターンの分析結果
 */
function analyzeStarPattern(bodyStars) {
    // 各星の出現回数を計数
    const starCounts = {};
    bodyStars.forEach(star => {
        starCounts[star] = (starCounts[star] || 0) + 1;
    });
    
    // 最も多い星と最も少ない星を特定
    let maxStar = '';
    let maxCount = 0;
    let uniqueStars = 0;
    
    for (const star in starCounts) {
        if (starCounts[star] > maxCount) {
            maxStar = star;
            maxCount = starCounts[star];
        }
        uniqueStars++;
    }
    
    // 中央の星を特定
    const centerStar = bodyStars[4]; // 中央はインデックス4
    
    // 水平・垂直・対角線パターンを確認
    const horizontalPatterns = [
        [bodyStars[0], bodyStars[1], bodyStars[2]],  // 上段
        [bodyStars[3], bodyStars[4], bodyStars[5]],  // 中段
        [bodyStars[6], bodyStars[7], bodyStars[8]]   // 下段
    ];
    
    const verticalPatterns = [
        [bodyStars[0], bodyStars[3], bodyStars[6]],  // 左列
        [bodyStars[1], bodyStars[4], bodyStars[7]],  // 中列
        [bodyStars[2], bodyStars[5], bodyStars[8]]   // 右列
    ];
    
    const diagonalPatterns = [
        [bodyStars[0], bodyStars[4], bodyStars[8]],  // 左上から右下
        [bodyStars[2], bodyStars[4], bodyStars[6]]   // 右上から左下
    ];
    
    // 特徴的なパターンを判定
    let patternDesc = '';
    let overallDesc = '';
    
    // 単一の星が多い場合
    if (maxCount >= 3) {
        patternDesc += `<p>あなたの星図には「${maxStar}」が${maxCount}個あり、その特性が強く出ています。</p>`;
    }
    
    // 多様な星がある場合
    if (uniqueStars >= 7) {
        patternDesc += '<p>多様な星がバランスよく配置されているため、多面的な統合された能力を持つパターンです。</p>';
    }
    
    // 中央の星の重要性
    patternDesc += `<p>中央にある「${centerStar}」はあなたの人格の核となる要素です。かまよそゆえく徹底的にこの星の特性を理解し、活かすことが重要です。</p>`;
    
    // 明確なラインがあるか確認
    let hasStrongLine = false;
    [...horizontalPatterns, ...verticalPatterns, ...diagonalPatterns].forEach(line => {
        if (line[0] === line[1] && line[1] === line[2]) {
            hasStrongLine = true;
            patternDesc += `<p>3つの「${line[0]}」が一直線上に并んでいます。これはその星の特性が非常に強く出ることを意味します。</p>`;
        }
    });
    
    // 全体的な解釈
    overallDesc = `あなたの星図は、各星の配置から、あなたの性格や運命の流れを表しています。中央にある「${centerStar}」はあなたの中心的なエネルギーを表し、${hasStrongLine ? '一直線上に並ぶパターンは強い方向性を示しています。' : '各位置にある星はそれぞれの場所で独自の影響を与えています。'}

各星をクリックすると、その星の意味や他の星との関係が詳しくわかります。`;
    
    return { patternDesc, overallDesc };
}

/**
 * 五行バランスを解釈して説明文を生成する関数
 * @param {Array} vals - 木火土金水の数値配列 [wood, fire, earth, metal, water]
 * @returns {String} HTML形式の解釈文
 */
function interpretGogyoBalance(vals) {
    // 各要素名称と対応する絵文字アイコン
    const elements = [
        { name: '木', icon: '🌳', color: '#00c853', description: '成長・発展・柔軟性・創造力' },
        { name: '火', icon: '🔥', color: '#ff5722', description: '情熱・表現力・行動力・活力' },
        { name: '土', icon: '🌍', color: '#ffca28', description: '安定・調和・中庸・バランス' },
        { name: '金', icon: '✨', color: '#2979ff', description: '決断力・精密さ・意志・正確さ' },
        { name: '水', icon: '💧', color: '#00b8d4', description: '流動性・知性・智慧・適応力' }
    ];
    
    // 合計値と最大値、最小値を計算
    const total = vals.reduce((sum, val) => sum + val, 0);
    const max = Math.max(...vals);
    const min = Math.min(...vals);
    const maxIndex = vals.indexOf(max);
    const minIndex = vals.indexOf(min);
    
    // バランスタイプの判定
    let balanceType = '';
    let balanceDesc = '';
    
    if (max - min <= 1) {
        balanceType = 'バランス型';
        balanceDesc = 'あなたは五行がバランス良く分布しているタイプです。多様な状況に対応できる柔軟性と適応力があり、自分の民度を発揮できる異国ー経済をもつことができます。また、他者の視点や立場も理解しやすく、協調性に優れています。';
    } else if (total <= 2) {
        balanceType = '減衰型';
        balanceDesc = '五行全体のエネルギーが少なめです。地道な努力と忙久を大切にして、無理なく少しずつ前進することで着実な成長を達成できるでしょう。自分のペースを大切にしてください。';
    } else if (total >= 10) {
        balanceType = '迅速型';
        balanceDesc = '五行全体のエネルギーが大変に高いレベルです。早い置ゆえの成長や変化が期待できますが、バランスを保つことが重要です。無理な時は一歩引いて立ち止まる知恵も必要です。';
    } else {
        if (max >= 3 && max > vals.reduce((sum, val) => sum + val, 0) / 2) {
            // 特定の要素が突出している場合
            balanceType = `${elements[maxIndex].name}元突出型`;
            switch (maxIndex) {
                case 0: // 木が突出
                    balanceDesc = 'あなたは成長と発展のエネルギーが特に強いタイプです。創造力や柔軟な思考が賛やられ、忙息する為に頑張ること。木の要素が引き立つ場での比較的蒸すことはあるでしょう。木が持つ伸びる力や柔軟性を活かして、新しい分野やプロジェクトにチャレンジしてみると良いでしょう。';
                    break;
                case 1: // 火が突出
                    balanceDesc = 'あなたは情熱と活力のエネルギーが特に強いタイプです。表現力や行動力に優れ、目標に向かって情熱的に進むことができます。ただし、時に熱くなりすぎてバランスを崩すこともあるため、冷静さを保つ練習も必要です。身体や心を落ち着けるような趣味に時間を使うことで、よりバランスの取れた生活が送れるでしょう。';
                    break;
                case 2: // 土が突出
                    balanceDesc = 'あなたは安定と調和のエネルギーが特に強いタイプです。中庸を保ち、区まえだよ。たｄｇｌ調停を取ることが得意です。常に安定した状況を好み、変化よりも確実さを優先することがあります。登山した一歩ずつできることが達成嬅を高めますが、時には変化や新しいチャレンジも受け入れる柔軟性を意識すると良いでしょう。';
                    break;
                case 3: // 金が突出
                    balanceDesc = 'あなたは決断力と精密さのエネルギーが特に強いタイプです。意志が強く、正確さを重視する傾向があります。細かい部分まで目を光らせ、高い品質を追求する役割の特銘度が高いです。また、立ウーハ逆境に負けない強さも持ち合ㅱてど。外し、時に目層したり、柔軟性や常質を殺すこともあるため、周囲の意見を受け入れる心の余裕を持つ努力も大切です。';
                    break;
                case 4: // 水が突出
                    balanceDesc = 'あなたは流動性と知性のエネルギーが特に強いタイプです。智慧と適応力に優れ、状況に応じて柔軟に対応することができます。想像力が豊かで、物事の本質を見模ま、空気のような知恵な人です。ただし、あまりにも柔軟すぎると確固たる心を失い、水のように多方向に散ってしまう危険もあります。目標や方向性を作って均文を定めることで、よりバランスの取れた生活が送れるでしょう。';
                    break;
            }
        } else {
            balanceType = '混合型';
            // 最も高い要素と最も低い要素の特徴を組み合わせた説明
            balanceDesc = `あなたは${elements[maxIndex].name}の特性が強く、${elements[minIndex].name}の特性が弱い傾向があります。${elements[maxIndex].name}の${elements[maxIndex].description}を活かしつつ、${elements[minIndex].name}の${elements[minIndex].description}を意識的に高めると良いでしょう。よりバランスの取れた生き方を意識することで、さらなる成長が期待できます。`;
        }
    }
    
    // 表示用HTMLを生成
    let html = `<div class="gogyo-interpretation-content">`;
    // ニックネームを取得
    const nickname = localStorage.getItem('userNickname') || 'お客様';
    html += `<h3>${nickname}さんの五行バランス: <span class="balance-type">${balanceType}</span></h3>`;
    
    // 各要素の数値と特性を表示
    html += `<div class="gogyo-elements">`;
    for (let i = 0; i < 5; i++) {
        const active = vals[i] > 0 ? 'active' : ''; 
        const emphasis = i === maxIndex ? 'emphasis' : (i === minIndex ? 'weak' : '');
        html += `<div class="gogyo-element ${active} ${emphasis}">
                    <span class="element-icon">${elements[i].icon}</span>
                    <span class="element-name">${elements[i].name}</span>
                    <span class="element-value">${vals[i]}</span>
                    <span class="element-desc">${elements[i].description}</span>
                </div>`;
    }
    html += `</div>`;
    
    // 解釈文を表示
    html += `<div class="gogyo-description">
                <p>${balanceDesc}</p>
             </div>`;
    
    html += `</div>`;
    return html;
}

/**
 * 五行バランスチャートを描画する関数
 * 完全に書き直してエラーが発生しないように修正
 * @param {Array} vals - 木火土金水の値の配列
 */
function drawGogyoChart(vals) {
    try {
        // 描画を行うエリアの取得と初期化
        const chartContainer = document.getElementById('gogyo-chart-area');
        if (!chartContainer) {
            console.error('チャートコンテナが見つかりません');
            return false;
        }
        
        // コンテナを表示状態にする
        chartContainer.style.display = '';
        
        // 既存の内容をすべて削除
        while (chartContainer.firstChild) {
            chartContainer.removeChild(chartContainer.firstChild);
        }
        
        // 図表用のキャンバスを作成
        const currentTime = new Date().getTime(); // キャッシュ回避用にユニークIDを生成
        const canvasId = `gogyoChart_${currentTime}`;
        const canvas = document.createElement('canvas');
        canvas.id = canvasId;
        canvas.width = 320;
        canvas.height = 320;
        canvas.style.display = 'block';
        canvas.style.margin = '0 auto';
        chartContainer.appendChild(canvas);
        
        // 図表の設定
        const ctx = canvas.getContext('2d');
        const labels = ['木', '火', '土', '金', '水'];
        const colors = [
            'rgba(0, 200, 83, 0.7)',  // 木: 緑
            'rgba(255, 87, 34, 0.7)', // 火: 赤橙
            'rgba(255, 202, 40, 0.7)', // 土: 黄
            'rgba(41, 121, 255, 0.7)', // 金: 青
            'rgba(0, 184, 212, 0.7)'  // 水: 水色
        ];
        
        // Chart.jsでグラフ描画
        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: '五行バランス',
                    data: vals,
                    backgroundColor: colors,
                    borderRadius: 8,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    title: { display: true, text: '五行バランス', color: '#222', font: { size: 18, weight: 'bold' } }
                },
                scales: {
                    x: { grid: { display: false }, ticks: { color: '#222', font: { weight: 'bold' } } },
                    y: { beginAtZero: true, grid: { color: '#eee' }, ticks: { color: '#222' } }
                }
            }
        });
        
        // 解釈エリアを追加する場所
        const gogyoInterp = document.createElement('div');
        gogyoInterp.id = 'gogyo-interpretation';
        gogyoInterp.className = 'gogyo-interpretation';
        gogyoInterp.innerHTML = interpretGogyoBalance(vals);
        chartContainer.appendChild(gogyoInterp);
        
        return true;
    } catch (error) {
        console.error('五行チャートの描画中にエラーが発生しました:', error);
        
        // エラーに関わらずチャートエリアは表示する
        const chartArea = document.getElementById('gogyo-chart-area');
        if (chartArea) {
            chartArea.style.display = '';
            chartArea.innerHTML = '<div class="error-message">[図表描画エラーが発生しました]</div>';
        }
        return false;
    }
}

// --- 人体星図（9マス）描画関数 ---
function renderStarChart(bodyStars) {
    const area = document.getElementById('star-chart-area');
    if (!area) return;
    
    // 星の種類ごとの色、アイコン、説明を定義
    const starInfo = {
        '貫索星': { colorClass: 'star-kansaku', icon: '🟢', desc: '自立心・守り・信念', advice: '自分の信念を大切にし、周囲と協調しながら進みましょう。守るべき価値観を大切にすることで、自分らしさを発揮できます。' },
        '石門星': { colorClass: 'star-sekimon', icon: '🟣', desc: '協調性・つながり・ネットワーク', advice: '人とのつながりを大切にし、ネットワークを広げることが運気アップの鍵です。協力や共感を能動的に引き出すことで、より充実した関係性を築けます。' },
        '鳳閣星': { colorClass: 'star-houkaku', icon: '🟡', desc: '表現力・自由・楽しみ', advice: '自分を表現し、楽しむことでチャンスが広がります。自由な発想や創造的な表現を楽しみ、空間や環境を明るくかったいだ雰囲気で満たしましょう。' },
        '調舒星': { colorClass: 'star-choujo', icon: '🟠', desc: '感受性・芸術・繊細さ', advice: '感受性を活かし、芸術的な活動に挑戦してみましょう。繊細な感性はあなたの大きな強みです。音楽や美術、文学など、美しいものに触れる時間を大切にしましょう。' },
        '禄存星': { colorClass: 'star-rokuzon', icon: '🔴', desc: '愛情・奉仕・包容力', advice: '周囲への思いやりや奉仕が、良いご縁を引き寄せます。愛情や寝情を表現することを恐れず、心の充足を大切にしてください。「与える」ことで復い発する喜びを享受できるでしょう。' },
        '司禄星': { colorClass: 'star-shiroku', icon: '🟤', desc: '堅実・蓄積・管理', advice: '計画的に物事を進めることで、安定した成果が得られます。管理能力や組織力を活かし、長期的な視点で物事を考えることで、堅実な基盤を築けます。' },
        '車騎星': { colorClass: 'star-shaki', icon: '🔵', desc: '行動力・実行・競争心', advice: '積極的な行動が運を開きます。チャレンジ精神を大切にし、失敗を恐れずに前に進むことで、高い成果を収めるでしょう。目標に向かって勇敢に進む勇気を持ちましょう。' },
        '牽牛星': { colorClass: 'star-kenkyu', icon: '🟧', desc: '責任感・社会性・リーダー', advice: 'リーダーシップを発揮し、周囲を導く役割を意識しましょう。責任を持って物事に向き合い、社会や組織の中で重要な役割を果たすことで、信頼と存在感を高めることができます。' },
        '龍高星': { colorClass: 'star-ryuko', icon: '🟨', desc: '知識・探究・冒険心', advice: '学びや冒険を恐れず、新しい世界に飛び込んでみましょう。知的好奇心と探究心を大切にし、未知の領域への挑戦を恐れないことで、視野を広げ、知恵を深めることができます。' },
        '玉堂星': { colorClass: 'star-gyokudo', icon: '⚪️', desc: '学び・伝統・知恵', advice: '知識を深め、伝統やルーツを大切にすることで成長できます。日々の学びと経験を積み重ね、過去からの知恵を尊重することで、真の知恵と実力を獲得できるでしょう。' }
    };

    let html = `<div class="star-chart-container">
                  <div class="body-silhouette"></div>
                  <div class="star-chart-grid">`;
    for (let i = 0; i < 9; i++) {
        const star = bodyStars[i];
        const info = starInfo[star] || { colorClass: '', icon: '⭐', desc: '', advice: '' };
        html += `<div class="star-cell ${info.colorClass} animate-star" data-star="${star}" tabindex="0" aria-label="${star} ${info.desc}">
                    <span class="star-icon">${info.icon}</span>
                    <span class="star-label">${star}</span>
                    <span class="star-tooltip">${info.desc}<br>${info.advice}</span>
                    <div class="position-number">${i+1}</div>
                 </div>`; // position-numberは1始まりに

    }
    html += `</div>
             <div class="click-hint">星をクリックすると詳細が表示されます</div>
           </div>`;
    area.innerHTML = html;

    // 星図の全体分析を行う
    const patternAnalysis = analyzeStarPattern(bodyStars);

    // 配置・相互関係の分析結果を表示するエリアを追加
    const relationArea = document.getElementById('star-relation-area');
    if (!relationArea) {
        const newRelationArea = document.createElement('div');
        newRelationArea.id = 'star-relation-area';
        newRelationArea.className = 'star-relation-area';
        area.parentNode.insertBefore(newRelationArea, area.nextSibling);
        relationArea = newRelationArea;
    }
    relationArea.innerHTML = `<div class="pattern-analysis">
                                <h3>星図パターン分析</h3>
                                <div class="pattern-content">${patternAnalysis.patternDesc}</div>
                              </div>`;
    
    // クリックでアドバイスと相互関係表示
    const adviceArea = document.getElementById('star-advice-area');
    // adviceAreaが存在しない場合は作成する
    if (!adviceArea) {
        console.warn('star-advice-areaが存在しません。処理をスキップします。');
        return; // adviceAreaが存在しない場合は処理を終了
    }
    
    const cells = area.querySelectorAll('.star-cell');
    cells.forEach((cell, index) => {
        const showDetail = function() {
            if (!adviceArea) return; // 安全チェック
            
            const star = cell.getAttribute('data-star');
            const info = starInfo[star] || { desc: '', advice: '' };
            const position = index;
            // 選択した星と他の星との関係を分析
            const relations = analyzeStarRelations(bodyStars, position);
            
            try {
                // アドバイスと相互関係を表示
                adviceArea.innerHTML = `<div class='advice-card'>
                                        <h3>${star}</h3>
                                        <p><b>意味:</b> ${info.desc}</p>
                                        <p class='advice-text'><b>アドバイス:</b> ${info.advice}</p>
                                        <p><b>位置:</b> ${getPositionName(position)}</p>
                                        <div class='star-relations'>
                                            <p><b>相互関係:</b></p>
                                            ${relations.html}
                                        </div>
                                    </div>`;
                                    
                // アニメーション効果
                adviceArea.classList.remove('advice-pop');
                void adviceArea.offsetWidth;
                adviceArea.classList.add('advice-pop');
                // クリックした星をハイライト
                cells.forEach(c => c.classList.remove('selected'));
                cell.classList.add('selected');
            } catch (error) {
                console.error('アドバイス表示エラー:', error);
            }
        };
        cell.addEventListener('click', showDetail);
        // キーボード操作・スマホ長押し対応
        cell.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') showDetail(); });
        cell.addEventListener('touchstart', function(e) {
            this._touchTimer = setTimeout(showDetail, 400);
        });
        cell.addEventListener('touchend', function(e) {
            clearTimeout(this._touchTimer);
        });
    });

    // 初期状態で星図全体の解説＋五行バランス・運勢スコアも表示
    let gogyoHtml = '';
    if (typeof window.currentGogyoVals !== 'undefined') {
        gogyoHtml = `<div class='gogyo-interpretation-content'><h3>五行バランス</h3>${interpretGogyoBalance(window.currentGogyoVals)}</div>`;
    }
    let scoreHtml = '';
    if (typeof window.currentFortuneScore !== 'undefined') {
        scoreHtml = `<div class='score-area'><b>運勢スコア:</b> <span class='score-value'>${window.currentFortuneScore}</span></div>`;
    }
    
    // adviceAreaが存在する場合のみ処理を行う
    if (adviceArea) {
        try {
            adviceArea.innerHTML = `<div class='advice-card'>
                                  <h3>星図全体の解説</h3>
                                  <p>${patternAnalysis.overallDesc}</p>
                                  ${gogyoHtml}
                                  ${scoreHtml}
                                  <p class="click-hint">各星をクリックすると詳細が表示されます</p>
                                </div>`;
            adviceArea.classList.add('advice-pop');
        } catch (error) {
            console.error('星図全体解説表示エラー:', error);
        }
    }
}
window.renderStarChart = renderStarChart;

/**
 * 占い結果をローカルストレージに保存する関数
 * @param {Object} data - APIから返された占い結果データ
 * @param {String} birthdate - 生年月日
 * @param {String} gender - 性別
 * @param {String} theme - 占いテーマ
 */
function saveFortuneResult(data, birthdate, gender, theme) {
    // 現在の日時を取得
    const now = new Date();
    const saveDate = now.toISOString();
    const displayDate = now.toLocaleString('ja-JP');
    
    // ユニークIDの生成
    const resultId = 'fortune_' + now.getTime();
    
    // 保存データの作成
    const saveData = {
        id: resultId,
        saveDate: saveDate,
        displayDate: displayDate,
        birthdate: birthdate,
        gender: gender,
        theme: theme,
        result: data
    };
    
    // すでに保存されている結果の取得
    let savedResults = JSON.parse(localStorage.getItem('fortuneResults') || '[]');
    
    // 最新の結果を先頭に追加
    savedResults.unshift(saveData);
    
    // 最大保存数を超えたらデータ削除（目安は20個）
    if (savedResults.length > 20) {
        savedResults = savedResults.slice(0, 20);
    }
    
    // ローカルストレージに保存
    localStorage.setItem('fortuneResults', JSON.stringify(savedResults));
    
    // 印刷用に最新の結果を保存
    localStorage.setItem('lastFortuneResult', JSON.stringify(saveData));
    
    console.log('結果が保存されました:', resultId);
    return resultId;
}

/**
 * 履歴表示と共有ボタンを追加する関数
 * @param {HTMLElement} container - ボタンを追加するコンテナ要素
 * @param {Object} data - 占い結果データ
 */
function addHistoryAndShareButtons(container, data) {
    // ボタンエリアがなければ作成
    let buttonsArea = document.getElementById('fortune-buttons-area');
    if (!buttonsArea) {
        buttonsArea = document.createElement('div');
        buttonsArea.id = 'fortune-buttons-area';
        buttonsArea.className = 'fortune-buttons';
        container.appendChild(buttonsArea);
    } else {
        buttonsArea.innerHTML = ''; // 既存の場合は一度クリア
    }
    
    // 履歴表示ボタン
    const historyButton = document.createElement('button');
    historyButton.className = 'fortune-button history-button';
    historyButton.innerHTML = '過去の占い結果を見る';
    historyButton.addEventListener('click', showFortuneHistory);
    buttonsArea.appendChild(historyButton);
    
    // 印刷ボタン
    const printButton = document.createElement('button');
    printButton.className = 'fortune-button print-button';
    printButton.innerHTML = '結果を印刷する';
    printButton.addEventListener('click', printFortuneResult);
    buttonsArea.appendChild(printButton);
}

/**
 * 履歴モーダルを表示する関数
 */
function showFortuneHistory() {
    // 保存されている占い結果を取得
    const savedResults = JSON.parse(localStorage.getItem('fortuneResults') || '[]');
    
    // 履歴がない場合
    if (savedResults.length === 0) {
        alert('保存された占い結果がありません。');
        return;
    }
    
    // モーダル要素の作成
    const modal = document.createElement('div');
    modal.className = 'fortune-modal';
    modal.innerHTML = `
        <div class="fortune-modal-content">
            <div class="fortune-modal-header">
                <h3>過去の占い結果</h3>
                <span class="close-modal">&times;</span>
            </div>
            <div class="fortune-modal-body">
                <ul class="fortune-history-list"></ul>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // モーダル内の履歴リストエリア
    const historyList = modal.querySelector('.fortune-history-list');
    
    // 各結果をリストに追加
    savedResults.forEach((item, index) => {
        const listItem = document.createElement('li');
        listItem.className = 'fortune-history-item';
        
        // テーマ名を日本語表示に変換
        const themeDisplay = {
            'general': '総合運',
            'love': '恋愛運',
            'work': '仕事運',
            'health': '健康運'
        };
        
        listItem.innerHTML = `
            <div class="history-date">${item.displayDate}</div>
            <div class="history-info">
                <p><strong>生年月日:</strong> ${item.birthdate}</p>
                <p><strong>テーマ:</strong> ${themeDisplay[item.theme] || item.theme}</p>
            </div>
            <button class="view-history-btn" data-id="${item.id}">表示</button>
        `;
        historyList.appendChild(listItem);
        
        // 表示ボタンのイベントリスナー
        listItem.querySelector('.view-history-btn').addEventListener('click', function() {
            loadFortuneResult(item.id);
            closeModal(modal);
        });
    });
    
    // 閉じるボタンのイベント
    modal.querySelector('.close-modal').addEventListener('click', () => closeModal(modal));
    
    // モーダル外クリックで閉じる
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal(modal);
        }
    });
    
    // モーダルを表示
    setTimeout(() => {
        modal.style.opacity = '1';
    }, 10);
}

/**
 * モーダルを閉じる関数
 * @param {HTMLElement} modal - モーダル要素
 */
function closeModal(modal) {
    modal.style.opacity = '0';
    setTimeout(() => {
        document.body.removeChild(modal);
    }, 300);
}

/**
 * 保存された占い結果を読み込む関数
 * @param {String} resultId - 結果ID
 */
function loadFortuneResult(resultId) {
    const savedResults = JSON.parse(localStorage.getItem('fortuneResults') || '[]');
    const result = savedResults.find(item => item.id === resultId);
    
    if (!result) {
        alert('指定された結果が見つかりません。');
        return;
    }
    
    // フォームに値を設定
    document.getElementById('birthdate').value = result.birthdate;
    document.getElementById('gender').value = result.gender;
    document.getElementById('theme').value = result.theme;
    
    // 結果を表示するためにフォーム送信イベントをトリガー
    document.getElementById('fortune-form').requestSubmit();
}

/**
 * 占い結果を印刷する関数
 */
function printFortuneResult() {
    window.print();
}

/**
 * ソーシャルメディアで占い結果を共有する関数
 * @param {String} platform - 共有先プラットフォーム
 * @param {Object} data - 占い結果データ
 */
function shareOnSocialMedia(platform, data) {
    // 共有用テキストの生成
    let birthdate = document.getElementById('birthdate').value;
    let theme = document.getElementById('theme').value;
    
    const shareText = `算命学占い結果 - ${birthdate}生まれ | `;
    const shareUrl = window.location.href;
    
    // テーマに応じた説明文
    let description = '';
    if (data.fortune) {
        if (theme === 'general' && data.fortune.yearFortune) {
            description = data.fortune.yearFortune;
        } else if (theme === 'love' && data.fortune.love) {
            description = data.fortune.love;
        } else if (theme === 'work' && data.fortune.work) {
            description = data.fortune.work;
        } else if (theme === 'health' && data.fortune.health) {
            description = data.fortune.health;
        }
    }
    
    // 説明文が長すぎる場合は省略
    if (description.length > 50) {
        description = description.substring(0, 50) + '...';
    }
    
    const fullShareText = shareText + description;
    
    // 共有URLの生成
    let shareLink = '';
    
    switch (platform) {
        case 'twitter':
            shareLink = `https://twitter.com/intent/tweet?text=${encodeURIComponent(fullShareText)}&url=${encodeURIComponent(shareUrl)}`;
            break;
        case 'facebook':
            shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(fullShareText)}`;
            break;
        case 'line':
            shareLink = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(fullShareText)}`;
            break;
        default:
            alert('サポートされていないプラットフォームです');
            return;
    }
    
    // 新しいウィンドウで共有ページを開く
    window.open(shareLink, '_blank', 'width=600,height=400');
}

// スターチャートレンダリング関数をグローバルに公開（一度だけ宣言）
window.renderStarChart = renderStarChart;

// 全体で共有するグローバル変数の定義
// 初期化されていなければ初期化する
if (typeof window.gogyoChart === 'undefined') {
    window.gogyoChart = null;
}

/**
 * 五行のバランスをグラフで描画する関数
 * @param {Array} gogyoVals - 木、火、土、金、水の値の配列
 */
function drawGogyoChart(gogyoVals) {
    try {
        // 描画先のコンテナを取得
        const container = document.getElementById('gogyo-chart-container');
        if (!container) {
            console.error('チャートコンテナが見つかりません');
            return;
        }
        
        // 五行の要素名と色の定義
        const labels = ['木', '火', '土', '金', '水'];
        const colors = [
            'rgba(0, 200, 83, 0.7)',   // 木: 緑
            'rgba(255, 87, 34, 0.7)',  // 火: 赤橙
            'rgba(255, 202, 40, 0.7)', // 土: 黄
            'rgba(41, 121, 255, 0.7)', // 金: 青
            'rgba(0, 184, 212, 0.7)'   // 水: 水色
        ];
        
        // コンテナをクリア
        container.innerHTML = '';
        
        // 新しいキャンバス要素を作成
        const canvas = document.createElement('canvas');
        canvas.id = `gogyo-chart-${Date.now()}`;
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        container.appendChild(canvas);
        
        // グローバル変数にチャートが存在する場合は破棄（メモリリーク防止）
        if (window.gogyoChart instanceof Chart) {
            try {
                window.gogyoChart.destroy();
                window.gogyoChart = null;
            } catch (e) {
                console.warn('古いチャートの破棄に失敗:', e);
                // エラーが発生しても続行
            }
        }
        
        // データセットの準備
        const chartData = {
            labels: labels,
            datasets: [{
                label: '五行バランス',
                data: gogyoVals,
                backgroundColor: colors.map(color => color.replace('0.7', '0.2')),
                borderColor: colors,
                borderWidth: 1
            }]
        };
        
        // チャートオプション
        // 実際のデータの最大値を取得する（最小値は3）
        const dataMax = Math.max(...gogyoVals, 3);
        
        const chartOptions = {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                r: {
                    min: 0,
                    max: dataMax,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        };
        
        // 新しいチャートを作成
        const chartContext = canvas.getContext('2d');
        const newChart = new Chart(chartContext, {
            type: 'radar',
            data: chartData,
            options: chartOptions
        });
        
        // グローバル変数に保存
        window.gogyoChart = newChart;
        
        console.log('五行チャートの描画が完了しました');
    } catch (error) {
        console.error('五行チャートの描画エラー:', error);
        const container = document.getElementById('gogyo-chart-container');
        if (container) {
            container.innerHTML = `
                <div style="color:red;text-align:center;padding:20px">
                    グラフ描画時にエラーが発生しました。<br>
                    ${error.message || 'Chart.jsエラー'}
                </div>
            `;
        }
    }
}

/**
 * 使用状況を記録する関数
 * @param {string} type - 占いの種類 ('basic' または 'time-fortune')
 */
function updateUsageCount(type) {
    try {
        // 現在の使用状況を取得
        let usageCount = JSON.parse(localStorage.getItem('usageCount')) || {
            total: 0,
            dates: {}
        };
        
        // 今日の日付
        const today = new Date().toISOString().split('T')[0];
        
        // カウントを更新
        usageCount.total = (usageCount.total || 0) + 1;
        usageCount.dates[today] = (usageCount.dates[today] || 0) + 1;
        
        // オプションでタイプ別のカウントも記録
        if (!usageCount.types) {
            usageCount.types = {};
        }
        usageCount.types[type] = (usageCount.types[type] || 0) + 1;
        
        // 保存
        localStorage.setItem('usageCount', JSON.stringify(usageCount));
        
    } catch (error) {
        console.error('使用カウントの更新エラー:', error);
    }
}

// 関数をグローバルに公開
window.updateUsageCount = updateUsageCount;

/**
 * ウェルカムバック表示の確認を行う関数
 */
function checkWelcomeBack() {
    // 希望で非表示設定されていないか確認
    const hideWelcome = localStorage.getItem('hideWelcomeBack');
    if (hideWelcome === 'true') {
        return; // 非表示設定なら何もせず終了
    }
    
    // 保存された結果があるか確認
    const savedResults = JSON.parse(localStorage.getItem('fortuneResults') || '[]');
    if (savedResults.length === 0) {
        return; // 保存結果がなければ終了
    }
    
    // 直近の結果を取得
    const lastResult = savedResults[0];
    lastFortuneData = lastResult;
    
    // 前回の占いからの経過日数を計算
    const lastDate = new Date(lastResult.saveDate);
    const today = new Date();
    const daysDiff = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
    
    // 3ヵ月（約90日）以上前の場合は表示しない
    if (daysDiff > 90) {
        return;
    }
    
    // ニックネームを取得する
    const nickname = localStorage.getItem('userNickname') || lastResult.result.name || 'お客様';
    
    // ユーザー情報を表示
    document.getElementById('user-profile-name').textContent = nickname;
    document.getElementById('days-since-last').textContent = daysDiff;
    document.getElementById('user-birthdate').textContent = formatDate(lastResult.birthdate);
    document.getElementById('user-gender').textContent = lastResult.gender === 'male' ? '男性' : 
                                                     lastResult.gender === 'female' ? '女性' : 'その他';
    
    // ウェルカムバック表示
    document.getElementById('welcome-back').style.display = 'block';
    
    // フォームに前回の値を設定
    document.getElementById('birthdate').value = lastResult.birthdate;
    document.getElementById('gender').value = lastResult.gender;
    
    // ニックネーム編集ボタンのイベントリスナーを設定
    document.getElementById('edit-nickname').addEventListener('click', editNickname);
}

/**
 * ウェルカムバック表示を非表示にする
 */
function hideWelcomeBack() {
    document.getElementById('welcome-back').style.display = 'none';
}

/**
 * 最新の占い結果を表示する
 */
function showLastFortuneResult() {
    if (!lastFortuneData) {
        // 最終結果がない場合は履歴表示
        showFortuneHistory();
        return;
    }
    
    hideWelcomeBack();
    loadFortuneResult(lastFortuneData.id);
    
    // 結果表示にスクロール
    document.getElementById('result').scrollIntoView({ behavior: 'smooth' });
}

/**
 * 日付をフォーマットして表示する
 * @param {string} dateString - ISO形式の日付文字列
 * @return {string} 整形された日付文字列
 */
function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        if (isNaN(date)) return dateString; // パース失敗時は元の値を返す
        
        return date.getFullYear() + '年' + (date.getMonth() + 1) + '月' + date.getDate() + '日';
    } catch (e) {
        return dateString;
    }
}

/**
 * ニックネーム編集機能
 */
function editNickname() {
    // 現在のニックネームを取得
    const currentNickname = document.getElementById('user-profile-name').textContent;
    
    // ニックネーム入力ダイアログを表示
    const newNickname = prompt('ニックネームを入力してください:', currentNickname);
    
    // キャンセル時は何もしない
    if (newNickname === null) return;
    
    // 空の場合は「お客様」に設定
    const nickname = newNickname.trim() || 'お客様';
    
    // ニックネームを保存
    localStorage.setItem('userNickname', nickname);
    
    // 表示を更新
    document.getElementById('user-profile-name').textContent = nickname;
}

/**
 * ウェルカムバックのボタンの初期化を行う
 */
function initWelcomeBackButtons() {
    // 前回の結果を見るボタン
    const viewLastBtn = document.getElementById('view-last-result');
    if (viewLastBtn) {
        viewLastBtn.addEventListener('click', function() {
            if (!lastFortuneData) {
                alert('占い結果が見つかりませんでした。');
                return;
            }
            loadFortuneResult(lastFortuneData.id);
            hideWelcomeBack();
            document.getElementById('result').scrollIntoView({ behavior: 'smooth' });
        });
    }
    
    // 占い履歴を見るボタン
    const viewHistoryBtn = document.getElementById('view-all-history');
    if (viewHistoryBtn) {
        viewHistoryBtn.addEventListener('click', function() {
            showFortuneHistory();
            hideWelcomeBack();
        });
    }
    
    // 新しい占いをするボタン
    const newFortuneBtn = document.getElementById('new-fortune');
    if (newFortuneBtn) {
        newFortuneBtn.addEventListener('click', function() {
            hideWelcomeBack();
            document.getElementById('fortune-form').scrollIntoView({ behavior: 'smooth' });
        });
    }
}

/**
 * 初回訪問時にニックネームを入力するか確認する関数
 */
function checkFirstTimeVisitor() {
    // ニックネームが未設定で、初訪問中にダイアログを表示したことがない場合
    if (!localStorage.getItem('userNickname') && !localStorage.getItem('nicknamePromptShown')) {
        // 占い結果がない場合のみ初回訪問と判断
        const fortuneResults = JSON.parse(localStorage.getItem('fortuneResults') || '[]');
        if (fortuneResults.length === 0) {
            // ニックネーム入力ダイアログを表示
            setTimeout(() => {
                const nickname = prompt('お客様のお名前やニックネームを教えてください（占い結果表示時に使用します）:');
                
                // キャンセルされた場合も「お客様」として設定
                const displayName = (nickname !== null) ? (nickname.trim() || 'お客様') : 'お客様';
                localStorage.setItem('userNickname', displayName);
                
                // ニックネームダイアログ表示済みを記録
                localStorage.setItem('nicknamePromptShown', 'true');
            }, 1000); // ページロード後1秒後に表示
        }
    }
}

/**
 * フォーム送信時にニックネームを結果に反映する
 * @param {Object} data - 占い結果データ
 * @returns {Object} - ニックネームを追加した占い結果データ
 */
function addNicknameToResult(data) {
    // ニックネームが設定されていれば追加
    const nickname = localStorage.getItem('userNickname');
    if (nickname) {
        // 深いコピーを作成して変更
        const newData = JSON.parse(JSON.stringify(data));
        newData.name = nickname;
        return newData;
    }
    return data;
}

// ウェルカムバック関連関数をグローバルに公開
window.checkWelcomeBack = checkWelcomeBack;
window.hideWelcomeBack = hideWelcomeBack;
window.showLastFortuneResult = showLastFortuneResult;
window.editNickname = editNickname;
window.addNicknameToResult = addNicknameToResult;
