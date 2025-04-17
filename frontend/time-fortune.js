/**
 * 時間運占い機能
 * 日運・月運・年運の計算と表示を行う
 */

/**
 * 時間運占いの結果を表示する関数
 * @param {string} birthdate - 生年月日
 * @param {string} gender - 性別
 * @param {string} timeType - 時間運の種類 ('day', 'month', 'year')
 */
async function calculateTimeFortune(birthdate, gender, timeType) {
    // 使用状況の記録
    updateUsageCount('time-fortune');
    // 結果表示用の要素を取得
    const resultDiv = document.getElementById('result');
    
    // ユーザーが初期化されていない場合は初期化する
    if (typeof currentUser === 'undefined' || !currentUser) {
        try {
            await window.initializeUser();
        } catch (error) {
            console.error('ユーザー初期化エラー:', error);
            // エラーが発生しても続行
        }
    }
    resultDiv.innerHTML = '<div class="loading">計算中...</div>';
    
    // 現在日付の取得
    const now = new Date();
    let periodText = '';
    
    // 時間運の種類に応じた処理
    switch (timeType) {
        case 'day':
            periodText = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日の運勢`;
            break;
        case 'month':
            periodText = `${now.getFullYear()}年${now.getMonth() + 1}月の運勢`;
            break;
        case 'year':
            periodText = `${now.getFullYear()}年の運勢`;
            break;
    }
    
    // 生年月日から五行エネルギーを計算
    const birthdate_obj = new Date(birthdate);
    const birthYear = birthdate_obj.getFullYear();
    const birthMonth = birthdate_obj.getMonth() + 1;
    const birthDay = birthdate_obj.getDate();
    
    // 五行エネルギーの計算
    const gogyoValues = calculateGogyoEnergyForDate(birthYear, birthMonth, birthDay, now, timeType);
    
    // 運勢テキストの生成
    const fortuneText = generateTimeFortune(gogyoValues, gender, timeType);
    
    // 星のエネルギー計算
    const starEnergy = calculateStarEnergy(birthYear, birthMonth, birthDay, now, timeType);
    
    // ニックネームを取得
    const nickname = localStorage.getItem('userNickname') || 'お客様';
    
    // 結果を表示
    resultDiv.innerHTML = `
        <h2>時間運占い結果</h2>
        <div class="time-fortune-header">
            <div class="time-fortune-title">${nickname}さんの${periodText}</div>
            <div class="time-fortune-subtitle">${birthYear}年${birthMonth}月${birthDay}日生まれ</div>
        </div>
        <div class="time-fortune-result">
            <div class="fortune-results-container">
                <div class="fortune-result-item general">
                    <h3>総合運</h3>
                    <p>${fortuneText.general.replace(/あなた/g, nickname)}</p>
                </div>
                <div class="fortune-result-item love">
                    <h3>恋愛運</h3>
                    <p>${fortuneText.love.replace(/あなた/g, nickname)}</p>
                </div>
                <div class="fortune-result-item work">
                    <h3>仕事運</h3>
                    <p>${fortuneText.work.replace(/あなた/g, nickname)}</p>
                </div>
                <div class="fortune-result-item health">
                    <h3>健康運</h3>
                    <p>${fortuneText.health.replace(/あなた/g, nickname)}</p>
                </div>
            </div>
            <div class="time-fortune-advice">
                <h3>アドバイス</h3>
                <p>${fortuneText.advice.replace(/あなた/g, nickname)}</p>
            </div>
        </div>
    `;
    
    // 五行バランスチャートを描画
    const gogyoChartArea = document.getElementById('gogyo-chart-area');
    if (gogyoChartArea) {
        gogyoChartArea.style.display = '';
        // main.jsのdrawGogyoChart関数が見つからない場合はここで定義した関数を使用
        if (typeof window.drawGogyoChart === 'function') {
            window.drawGogyoChart(gogyoValues);
        } else {
            drawTimeFortuneChart(gogyoValues);
        }
    }
    
    // 星エネルギーの表示（オプション）
    if (starEnergy && Array.isArray(starEnergy) && starEnergy.length === 9) {
        const starChartAreaId = 'star-chart-area';
        let starChartArea = document.getElementById(starChartAreaId);
        if (starChartArea) {
            renderStarChart(starEnergy);
            starChartArea.style.display = '';
        }
    }
    
    // 時間運の結果をサーバーとローカルストレージに保存
    const saveData = {
        type: 'time-fortune',
        timeType: timeType,
        birthdate: birthdate,
        gender: gender,
        date: now.toISOString(),
        result: fortuneText
    };
    
    try {
        // 非同期で結果を保存
        const resultId = await saveTimeFortuneResult(saveData);
        console.log('時間運占い結果を保存しました:', resultId);
    } catch (saveError) {
        console.error('時間運占い結果の保存に失敗しました:', saveError);
        // 保存エラーは表示せず、結果の表示は続行
    }
    
    // 共有ボタンを追加
    addHistoryAndShareButtons(resultDiv, { fortune: fortuneText });
}

/**
 * 生年月日と現在日から五行エネルギーを計算
 * @param {Number} birthYear - 誕生年
 * @param {Number} birthMonth - 誕生月
 * @param {Number} birthDay - 誕生日
 * @param {Date} currentDate - 現在日
 * @param {String} timeType - 時間運の種類
 * @returns {Array} 五行値の配列 [木, 火, 土, 金, 水]
 */
function calculateGogyoEnergyForDate(birthYear, birthMonth, birthDay, currentDate, timeType) {
    // 算命学の基本的な五行計算（簡易版）
    // 実際の算命学ではより複雑な計算が必要ですが、ここでは簡易的に実装
    
    // 干支計算の基本値
    const base = (birthYear - 1900) % 10;
    
    // 日・月・年の数値に基づく五行の基本値
    const yearBase = [5, 6, 7, 8, 9, 0, 1, 2, 3, 4][base];
    const monthBase = (birthMonth + yearBase) % 5;
    const dayBase = (birthDay + monthBase) % 5;
    
    // 現在日付から算出する五行値
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const currentDay = currentDate.getDate();
    
    // 今年・今月・今日の数値
    const nowYearBase = (currentYear - 1900) % 10;
    const nowMonthBase = (currentMonth + nowYearBase) % 5;
    const nowDayBase = (currentDay + nowMonthBase) % 5;
    
    // 木・火・土・金・水の五行エネルギー値
    let gogyoValues = [0, 0, 0, 0, 0];
    
    // 時間運タイプに応じたエネルギー値の計算
    switch(timeType) {
        case 'day':
            // 日運は今日の値が強く影響
            gogyoValues[(nowDayBase + 0) % 5] += 5;  // 今日の主要エネルギー
            gogyoValues[(nowDayBase + 1) % 5] += 3;  // 副次エネルギー
            gogyoValues[(nowDayBase + 2) % 5] += 1;  // 弱いエネルギー
            
            // 生年月日との相性
            gogyoValues[(dayBase + 0) % 5] += 3;  // 誕生日との相性
            gogyoValues[(monthBase + 0) % 5] += 2;  // 誕生月との相性
            gogyoValues[(yearBase + 0) % 5] += 1;  // 誕生年との相性
            break;
            
        case 'month':
            // 月運は今月の値が強く影響
            gogyoValues[(nowMonthBase + 0) % 5] += 5;  // 今月の主要エネルギー
            gogyoValues[(nowMonthBase + 1) % 5] += 3;  // 副次エネルギー
            gogyoValues[(nowMonthBase + 2) % 5] += 1;  // 弱いエネルギー
            
            // 生年月日との相性
            gogyoValues[(monthBase + 0) % 5] += 3;  // 誕生月との相性
            gogyoValues[(yearBase + 0) % 5] += 2;  // 誕生年との相性
            break;
            
        case 'year':
            // 年運は今年の値が強く影響
            gogyoValues[(nowYearBase + 0) % 5] += 5;  // 今年の主要エネルギー
            gogyoValues[(nowYearBase + 1) % 5] += 3;  // 副次エネルギー
            gogyoValues[(nowYearBase + 2) % 5] += 1;  // 弱いエネルギー
            
            // 生年月日との相性
            gogyoValues[(yearBase + 0) % 5] += 3;  // 誕生年との相性
            break;
    }
    
    // ランダム性を少し加える（運勢予測の多様性のため）
    for(let i = 0; i < 5; i++) {
        gogyoValues[i] += Math.floor(Math.random() * 2);
    }
    
    // 最低値を保証
    return gogyoValues.map(val => Math.max(val, 1));
}

/**
 * 星エネルギーを計算する関数
 * @param {Number} birthYear - 誕生年
 * @param {Number} birthMonth - 誕生月
 * @param {Number} birthDay - 誕生日
 * @param {Date} currentDate - 現在日
 * @param {String} timeType - 時間運の種類
 * @returns {Array} 9マスの星配列
 */
function calculateStarEnergy(birthYear, birthMonth, birthDay, currentDate, timeType) {
    // 簡易版の実装
    // 実際の算命学では、より複雑な計算が必要
    const stars = [
        '貫索星', '石門星', '鳳閣星',
        '調舒星', '禄存星', '司禄星',
        '車騎星', '牽牛星', '龍高星'
    ];
    
    // 生年月日と現在日から基準値を計算
    const baseValue = (birthYear + birthMonth + birthDay) % 9;
    const currentValue = (currentDate.getFullYear() + currentDate.getMonth() + currentDate.getDate()) % 9;
    
    // 時間運タイプに基づく星の移動計算
    let shift;
    switch(timeType) {
        case 'day':
            shift = (currentValue * 3) % 9;
            break;
        case 'month':
            shift = (currentValue * 2) % 9;
            break;
        case 'year':
            shift = currentValue % 9;
            break;
        default:
            shift = 0;
    }
    
    // 星の再配置（シフト）
    let result = new Array(9);
    for (let i = 0; i < 9; i++) {
        result[(i + shift) % 9] = stars[(i + baseValue) % 9];
    }
    
    return result;
}

/**
 * 時間運の運勢テキストを生成する関数
 * @param {Array} gogyoValues - 五行値の配列
 * @param {String} gender - 性別
 * @param {String} timeType - 時間運の種類
 * @returns {Object} 運勢テキスト
 */
function generateTimeFortune(gogyoValues, gender, timeType) {
    // 五行の強さに基づいて運勢テキストを生成
    const strongestElement = getStrongestElement(gogyoValues);
    const weakestElement = getWeakestElement(gogyoValues);
    
    // 時間運のタイプに基づく基本テキスト
    let baseText;
    switch(timeType) {
        case 'day':
            baseText = generateDayFortuneText(strongestElement, weakestElement);
            break;
        case 'month':
            baseText = generateMonthFortuneText(strongestElement, weakestElement);
            break;
        case 'year':
            baseText = generateYearFortuneText(strongestElement, weakestElement);
            break;
        default:
            baseText = {
                general: '五行のバランスが取れています。',
                love: '平穏な時期です。',
                work: '通常通りの仕事運です。',
                health: '健康状態は安定しています。',
                advice: '特別な変化はなく、日常を大切にする時期です。'
            };
    }
    
    return baseText;
}

/**
 * 五行値から最も強い要素を取得
 * @param {Array} gogyoValues - 五行値の配列
 * @returns {String} 最も強い五行要素
 */
function getStrongestElement(gogyoValues) {
    const max = Math.max(...gogyoValues);
    const index = gogyoValues.indexOf(max);
    return ['木', '火', '土', '金', '水'][index];
}

/**
 * 五行値から最も弱い要素を取得
 * @param {Array} gogyoValues - 五行値の配列
 * @returns {String} 最も弱い五行要素
 */
function getWeakestElement(gogyoValues) {
    const min = Math.min(...gogyoValues);
    const index = gogyoValues.indexOf(min);
    return ['木', '火', '土', '金', '水'][index];
}

/**
 * 日運の運勢テキストを生成
 * @param {String} strongElement - 最も強い五行要素
 * @param {String} weakElement - 最も弱い五行要素
 * @returns {Object} 運勢テキスト
 */
function generateDayFortuneText(strongElement, weakElement) {
    const fortuneTexts = {
        '木': {
            general: '創造性が高まる日です。新しいアイデアや計画を立てるのに適しています。',
            love: '相手との会話が弾み、新鮮な関係が築けるでしょう。',
            work: '柔軟な発想が求められる仕事で成果を上げられます。',
            health: '軽い運動や散歩が心身の調子を整えるでしょう。',
            advice: '自分の考えを積極的に表現してみましょう。'
        },
        '火': {
            general: '活力に満ちた1日になるでしょう。情熱的に行動すると良い結果が得られます。',
            love: '感情表現が豊かになり、相手に気持ちが伝わりやすい日です。',
            work: 'プレゼンテーションや人前での発表が成功しやすいでしょう。',
            health: '体を動かすことでエネルギーの消費バランスが取れます。',
            advice: '感情の高ぶりを上手にコントロールすることが大切です。'
        },
        '土': {
            general: '安定感のある日です。地に足をつけた行動が実を結びます。',
            love: '落ち着いた雰囲気の中で相手との絆が深まるでしょう。',
            work: '地道な努力が評価される日です。基礎固めに適しています。',
            health: '規則正しい生活リズムを保つことが健康の鍵となります。',
            advice: '焦らず一歩一歩進むことで確実な成果が得られます。'
        },
        '金': {
            general: '物事の価値を見極める力が高まる日です。選択や判断が的確になります。',
            love: '相手の良さを再発見し、関係が洗練されていくでしょう。',
            work: '細部への気配りが評価され、信頼を得られる日です。',
            health: '美しいものに触れることでリラックス効果が高まります。',
            advice: '質の高さを意識した行動が運気を高めます。'
        },
        '水': {
            general: '直感力が冴える日です。柔軟な対応で状況を好転させられるでしょう。',
            love: '相手の気持ちを敏感に感じ取れる日です。心の交流が深まります。',
            work: '情報収集や分析作業が捗り、新たな発見があるでしょう。',
            health: '十分な水分補給と質の良い睡眠を心がけましょう。',
            advice: '周囲の変化に柔軟に対応することで運気が開けます。'
        }
    };
    
    // 弱い要素に基づく注意点を追加
    const cautions = {
        '木': 'ただし、物事を進める際には計画性を忘れないように。',
        '火': '感情的になりすぎないよう冷静さも大切にしましょう。',
        '土': '柔軟性を失わないよう、新しい視点も取り入れて。',
        '金': '完璧を求めすぎると疲れてしまうので、バランスを意識して。',
        '水': '考えすぎて行動が遅れないよう、時には決断も必要です。'
    };
    
    // 強い要素の運勢に弱い要素の注意点を加える
    const result = { ...fortuneTexts[strongElement] };
    result.advice += ' ' + cautions[weakElement];
    
    return result;
}

/**
 * 月運の運勢テキストを生成
 * @param {String} strongElement - 最も強い五行要素
 * @param {String} weakElement - 最も弱い五行要素
 * @returns {Object} 運勢テキスト
 */
function generateMonthFortuneText(strongElement, weakElement) {
    const fortuneTexts = {
        '木': {
            general: '成長と発展の月です。新しいプロジェクトや挑戦に適した時期でしょう。',
            love: '関係が新たな段階に進む可能性があります。積極的なアプローチが実を結びます。',
            work: '創造的なアイデアが浮かびやすく、キャリアの成長につながるでしょう。',
            health: '適度な運動を取り入れることで、心身のバランスが整います。',
            advice: '柔軟な思考と行動力を活かして、新しい可能性を広げていきましょう。'
        },
        '火': {
            general: '情熱と活力に満ちた月になるでしょう。自己表現が注目される時期です。',
            love: '魅力が高まり、異性からの注目を集めやすい時期です。',
            work: 'リーダーシップを発揮する機会が増え、周囲に良い影響を与えられます。',
            health: 'エネルギッシュな活動と十分な休息のバランスが重要です。',
            advice: '熱意を持って取り組む姿勢が周囲の協力を引き寄せるでしょう。'
        },
        '土': {
            general: '安定と基盤を固める月です。地道な努力が実を結ぶ時期でしょう。',
            love: '信頼関係が深まり、長期的な視点での関係構築に適しています。',
            work: '責任ある立場や役割を任される可能性があります。堅実さが評価されます。',
            health: '規則正しい生活習慣が心身の安定につながります。',
            advice: '焦らず基礎を固めることで、将来の大きな成功につながります。'
        },
        '金': {
            general: '洗練と調和の月です。美的センスが高まり、周囲との関係も円滑になります。',
            love: '相手との関係が洗練され、穏やかな愛情表現が心を打つでしょう。',
            work: '細部への気配りや正確さが評価され、信頼を得られる時期です。',
            health: '質の高い食事や美しい環境がリラックス効果を高めます。',
            advice: '質にこだわる姿勢が、周囲からの尊敬と信頼を集めるでしょう。'
        },
        '水': {
            general: '知恵と直感が冴える月です。情報収集と学びが大きな財産になります。',
            love: '相手の気持ちを深く理解できる時期です。精神的なつながりが深まります。',
            work: '情報分析やコミュニケーション能力が高まり、円滑な人間関係が築けます。',
            health: '心の平静を保つことが健康維持の鍵となります。',
            advice: '流れに逆らわず、柔軟に対応することで道が開けるでしょう。'
        }
    };
    
    // 弱い要素に基づく月間の注意点
    const cautions = {
        '木': '計画性を欠くと、エネルギーが分散してしまう月になるかもしれません。',
        '火': '感情の起伏に振り回されないよう、冷静さを保つことも大切です。',
        '土': '変化を恐れず、新しい状況にも柔軟に対応する心構えを持ちましょう。',
        '金': '他者の意見にも耳を傾け、過度な完璧主義は避けることが肝心です。',
        '水': '優柔不断にならないよう、時には決断力も必要になるでしょう。'
    };
    
    // 強い要素の運勢に弱い要素の注意点を加える
    const result = { ...fortuneTexts[strongElement] };
    result.advice += ' ' + cautions[weakElement];
    
    return result;
}

/**
 * 年運の運勢テキストを生成
 * @param {String} strongElement - 最も強い五行要素
 * @param {String} weakElement - 最も弱い五行要素
 * @returns {Object} 運勢テキスト
 */
function generateYearFortuneText(strongElement, weakElement) {
    const fortuneTexts = {
        '木': {
            general: '成長と拡大の年です。新しい可能性に挑戦し、人生の幅を広げる時期となるでしょう。',
            love: '新鮮な出会いや関係の発展が期待できます。自然体で接することが幸運を呼びます。',
            work: '創造力とアイデアが評価され、キャリアの飛躍につながる年になるでしょう。',
            health: '適度な運動と自然との触れ合いが心身をリフレッシュさせます。',
            advice: '計画的に行動しながらも、柔軟性を持って新しい機会を活かしましょう。'
        },
        '火': {
            general: '情熱と活力に満ちた1年になります。自己表現と挑戦が実を結ぶ時期です。',
            love: 'パートナーシップに熱意と活力をもたらし、関係が活性化するでしょう。',
            work: 'リーダーシップを発揮する機会が増え、周囲に大きな影響を与えられます。',
            health: 'エネルギッシュに活動しつつ、適切な休息を取ることが重要です。',
            advice: '熱意と冷静さのバランスを保ちながら、目標に向かって進みましょう。'
        },
        '土': {
            general: '安定と基盤強化の年です。着実な成長と責任が増す時期となるでしょう。',
            love: '信頼と安定に基づいた関係が築かれ、将来を見据えた絆が深まります。',
            work: '責任ある立場への昇進や、重要なプロジェクトを任される可能性があります。',
            health: '規則正しい生活習慣が長期的な健康の鍵となります。',
            advice: '焦らず一歩一歩進むことで、堅固な成功の土台を築けるでしょう。'
        },
        '金': {
            general: '洗練と充実の年です。質の高い選択と判断力が運命を好転させるでしょう。',
            love: '互いの価値観を尊重し合う、品格のある関係が築かれます。',
            work: '正確さと細部への配慮が高く評価され、信頼と実績を積み重ねられます。',
            health: '美しい環境と質の高い生活習慣が心身の健康をもたらします。',
            advice: '本質的な価値を見極める目を養い、人生の質を高めていきましょう。'
        },
        '水': {
            general: '知恵と柔軟性の年です。変化に対応しながら、内面の成長が促される時期でしょう。',
            love: '精神的なつながりが深まり、互いの心の奥底まで理解し合える関係に発展します。',
            work: '情報収集と分析力が成功の鍵となり、知的な才能が開花するでしょう。',
            health: '心の平和を保つことが、身体の健康にも良い影響を与えます。',
            advice: '状況の変化に柔軟に対応しながら、本質を見極める洞察力を磨きましょう。'
        }
    };
    
    // 弱い要素に基づく年間の注意点
    const cautions = {
        '木': '長期的な視点を持ち、エネルギーの使い方に注意することが重要です。',
        '火': '情熱を持続させるために、時には休息をとり、エネルギーを蓄えることも大切です。',
        '土': '保守的になりすぎず、新しい可能性にも心を開くことが成長につながります。',
        '金': '完璧を求めすぎず、時には妥協することも必要になるでしょう。',
        '水': '思考と行動のバランスを意識し、実行力も高めていくと良いでしょう。'
    };
    
    // 強い要素の運勢に弱い要素の注意点を加える
    const result = { ...fortuneTexts[strongElement] };
    result.advice += ' ' + cautions[weakElement];
    
    return result;
}

/**
 * 時間運占い結果をサーバーとローカルストレージに保存
 * @param {Object} data - 保存するデータ
 * @returns {Promise<string>} 結果のID
 */
async function saveTimeFortuneResult(data) {
    // ユニークIDの生成
    const localResultId = 'time_fortune_' + Date.now();
    const saveData = { ...data, id: localResultId };
    
    // サーバーに結果を保存する試み
    let serverSaved = false;
    let resultId = localResultId;
    
    if (window.api && currentUser && !currentUser.offline) {
        try {
            const serverResult = await window.api.saveFortuneResult(saveData);
            if (serverResult.success) {
                serverSaved = true;
                resultId = serverResult.resultId || localResultId;
                saveData.id = resultId; // サーバーからのIDで上書き
            }
        } catch (error) {
            console.error('サーバー保存エラー:', error);
            // エラー時はローカルにのみ保存
        }
    }
    
    // フォールバックとしてローカルストレージにも保存
    let savedResults = JSON.parse(localStorage.getItem('fortuneResults') || '[]');
    savedResults.unshift(saveData);
    
    // 最大保存数を超えたらデータ削除（目安は20個）
    if (savedResults.length > 20) {
        savedResults = savedResults.slice(0, 20);
    }
    
    // ローカルストレージに保存
    localStorage.setItem('fortuneResults', JSON.stringify(savedResults));
    
    if (serverSaved) {
        console.log('時間運占い結果がサーバーとローカルに保存されました:', resultId);
    } else {
        console.log('時間運占い結果がローカルにのみ保存されました:', resultId);
    }
    
    return resultId;
}

// グローバル変数定義
var timeFortuneChart = null;

/**
 * 時間運占い用の五行チャート描画関数
 * @param {Array} values - 五行値の配列
 */
function drawTimeFortuneChart(values) {
    try {
        // 描画先のコンテナを取得
        const container = document.getElementById('gogyo-chart-area');
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
        
        // チャートコンテナを作成
        const chartContainerId = 'time-gogyo-chart-container';
        let chartContainer = document.getElementById(chartContainerId);
        
        // 既存のコンテナを削除して新しく作成
        if (chartContainer) {
            container.removeChild(chartContainer);
        }
        
        chartContainer = document.createElement('div');
        chartContainer.id = chartContainerId;
        chartContainer.style.width = '320px';
        chartContainer.style.height = '320px';
        chartContainer.style.margin = '0 auto';
        container.appendChild(chartContainer);
        
        // 新しいキャンバス要素を作成
        const canvas = document.createElement('canvas');
        canvas.id = `time-gogyo-chart-${Date.now()}`;
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        chartContainer.appendChild(canvas);
        
        // グローバル変数にチャートが存在する場合は破棄（メモリリーク防止）
        if (window.timeFortuneChart instanceof Chart) {
            try {
                window.timeFortuneChart.destroy();
                window.timeFortuneChart = null;
            } catch (e) {
                console.warn('古いチャートの破棄に失敗:', e);
            }
        }
        
        // データセットの準備
        const chartData = {
            labels: labels,
            datasets: [{
                label: '時間運の五行バランス',
                data: values,
                backgroundColor: colors,
                borderRadius: 8,
                borderWidth: 1
            }]
        };
        
        // チャートオプション
        const chartOptions = {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false },
                title: { display: true, text: '時間運の五行バランス', color: '#222', font: { size: 18, weight: 'bold' } }
            },
            scales: {
                x: { grid: { display: false }, ticks: { color: '#222', font: { weight: 'bold' } } },
                y: { beginAtZero: true, grid: { color: '#eee' }, ticks: { color: '#222' } }
            }
        };
        
        // 新しいチャートを作成
        const chartContext = canvas.getContext('2d');
        const newChart = new Chart(chartContext, {
            type: 'bar',
            data: chartData,
            options: chartOptions
        });
        
        // グローバル変数に保存
        window.timeFortuneChart = newChart;
        
        console.log('時間運の五行チャートの描画が完了しました');
    } catch (error) {
        console.error('時間運占いのチャート描画エラー:', error);
        const container = document.getElementById('gogyo-chart-area');
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

// メインJSファイルからアクセスできるように関数をグローバルに公開
window.calculateTimeFortune = calculateTimeFortune;
window.drawTimeFortuneChart = drawTimeFortuneChart;
