const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const CryptoJS = require('crypto-js');

// ユーザーデータのディレクトリパス
const usersDir = path.join(__dirname, '..', 'data', 'users');

// 秘密鍵（実際の環境では環境変数として設定することをお勧めします）
const SECRET_KEY = process.env.SECRET_KEY || 'sanmeigaku-secret-key';

// ラッキーカラー一覧
const luckyColors = [
  "赤", "青", "緑", "黄", "紫", "オレンジ", "ピンク", "白", "黒", "茶", 
  "水色", "金", "銀", "紺", "ベージュ", "グレー"
];

// ラッキーアイテム一覧
const luckyItems = [
  "鍵", "ペン", "本", "傘", "腕時計", "鞄", "帽子", "スマートフォン", 
  "手帳", "財布", "ハンカチ", "メガネ", "アクセサリー", "カード", "花",
  "お守り", "写真", "手紙", "カメラ", "音楽"
];

// ラッキーナンバー生成（1〜99）
function generateLuckyNumber() {
  return Math.floor(Math.random() * 99) + 1;
}

// その日の干支に基づくデイリーアドバイス
function getDailyAdvice(kanshi) {
  const advicePool = {
    overall: [
      "今日は新しいことを始めるのに適した日です。チャレンジ精神を持って行動しましょう。",
      "計画的に物事を進めると、良い結果につながります。スケジュールを見直してみましょう。",
      "直感を信じて行動すると吉です。心の声に耳を傾けましょう。",
      "周囲の人との対話を大切にする日です。コミュニケーションを積極的に取りましょう。",
      "物事の優先順位を考え直すと良い発見があるでしょう。",
      "今までと違う視点で物事を見ると、新たな可能性が見えてきます。",
      "慎重に行動すると良いでしょう。焦らず着実に進みましょう。",
      "過去の経験を活かせる日です。これまでの教訓を思い出してみましょう。",
      "柔軟な対応が求められる日です。状況に応じて計画を変更する勇気を持ちましょう。",
      "自分を大切にする日です。心身の健康に気を配りましょう。"
    ],
    work: [
      "チームでの協力が成功につながります。周囲と協力して取り組みましょう。",
      "創造力を発揮できる日です。新しいアイデアを積極的に出してみましょう。",
      "細部に注意を払うと成果が上がります。丁寧に仕事に取り組みましょう。",
      "効率を考えた作業が吉です。仕事の進め方を見直してみましょう。",
      "リーダーシップを発揮する良い機会です。積極的に意見を述べましょう。",
      "サポート役に徹すると評価されるでしょう。周囲のサポートを心がけましょう。",
      "長期的な視点で物事を考えると良いアイデアが生まれます。",
      "今日の努力が将来の大きな成果につながります。着実に進みましょう。",
      "新しい知識やスキルを得るチャンスです。学ぶ姿勢を大切にしましょう。",
      "仕事の質に焦点を当てると良い評価を得られるでしょう。"
    ],
    love: [
      "素直な気持ちを伝えると良い反応が返ってきます。勇気を出して一歩踏み出しましょう。",
      "相手の立場に立って考えることで理解が深まります。思いやりを持って接しましょう。",
      "共通の趣味や関心事について話すと距離が縮まります。",
      "小さな気遣いが関係を深める鍵となります。日常の中で相手を思いやる行動を心がけましょう。",
      "過去の出来事にとらわれず、今を大切にする姿勢が大切です。",
      "相手の良いところに目を向けると、関係が良好になります。",
      "自分の気持ちを整理する時間を持つと良いでしょう。",
      "偶然の出会いに注目する日です。日常の中の小さな出会いを大切にしましょう。",
      "相手の言葉の奥にある気持ちを汲み取る努力をすると理解が深まります。",
      "自然体で接することが吉です。等身大の自分を見せましょう。"
    ],
    health: [
      "水分補給を心がけると体調が良くなります。こまめに水を飲みましょう。",
      "軽い運動が活力を与えてくれます。ストレッチや散歩を取り入れましょう。",
      "質の良い睡眠を意識すると心身が整います。就寝前のリラックスタイムを大切にしましょう。",
      "バランスの良い食事を心がけると体調が安定します。",
      "深呼吸を意識すると心が落ち着きます。時々、呼吸を意識する時間を持ちましょう。",
      "姿勢を正すと気分も前向きになります。背筋を伸ばして過ごしましょう。",
      "五感を使って自然を感じると心が癒されます。外の空気を吸う時間を作りましょう。",
      "笑顔を意識すると心身が活性化します。笑顔で過ごしましょう。",
      "リラックスする時間を意識的に作ると心のバランスが保たれます。",
      "自分のペースを大切にすることで無理なく一日を過ごせます。"
    ]
  };
  
  // 日付に基づいてランダムに選ぶが、同じ日なら同じアドバイスになるようにする
  const today = new Date();
  const dateString = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
  const seed = dateString + kanshi; // 日付と干支を組み合わせてシード値に
  
  function seededRandom(seed) {
    const x = Math.sin(parseInt(seed, 36)) * 10000;
    return x - Math.floor(x);
  }
  
  return {
    overall: advicePool.overall[Math.floor(seededRandom(seed + 'overall') * advicePool.overall.length)],
    work: advicePool.work[Math.floor(seededRandom(seed + 'work') * advicePool.work.length)],
    love: advicePool.love[Math.floor(seededRandom(seed + 'love') * advicePool.love.length)],
    health: advicePool.health[Math.floor(seededRandom(seed + 'health') * advicePool.health.length)]
  };
}

// デイリー運勢の計算
function calculateDailyFortune(birthdate) {
  const today = new Date();
  const birthDate = new Date(birthdate);
  
  // 今日の干支（簡易版）
  const todayKanshi = calculateTodayKanshi();
  
  // 誕生日の干支（簡略版）
  const birthKanshi = calculateBirthDateKanshi(birthdate);
  
  // 月の五行
  const currentMonth = today.getMonth();
  const monthElement = [
    "水", "水", // 1月, 2月
    "木", "木", "木", // 3月, 4月, 5月
    "火", "火", "火", // 6月, 7月, 8月
    "金", "金", "金", // 9月, 10月, 11月
    "水" // 12月
  ][currentMonth];
  
  // 日の五行
  const todayElement = {
    "甲": "木", "乙": "木",
    "丙": "火", "丁": "火",
    "戊": "土", "己": "土",
    "庚": "金", "辛": "金",
    "壬": "水", "癸": "水"
  }[todayKanshi.charAt(0)];
  
  // 誕生日の五行
  const birthElement = {
    "甲": "木", "乙": "木",
    "丙": "火", "丁": "火",
    "戊": "土", "己": "土",
    "庚": "金", "辛": "金",
    "壬": "水", "癸": "水"
  }[birthKanshi.charAt(0)];
  
  // 相性マトリックス
  const compatibilityMatrix = {
    "木": { "木": 60, "火": 80, "土": 40, "金": 30, "水": 70 },
    "火": { "木": 70, "火": 60, "土": 80, "金": 40, "水": 30 },
    "土": { "木": 50, "火": 70, "土": 60, "金": 80, "水": 40 },
    "金": { "木": 30, "火": 50, "土": 70, "金": 60, "水": 80 },
    "水": { "木": 80, "火": 30, "土": 50, "金": 70, "水": 60 }
  };
  
  // 日付から数値を生成（毎日変化）
  const dateValue = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  // 誕生日から固定値を生成
  const birthValue = birthDate.getFullYear() * 10000 + (birthDate.getMonth() + 1) * 100 + birthDate.getDate();
  
  // 組み合わせて運勢のベース値を作成
  const baseLuck = (dateValue + birthValue) % 100;
  
  // 五行相性を加味
  const elementScore = compatibilityMatrix[birthElement][todayElement];
  const monthImpact = compatibilityMatrix[birthElement][monthElement];
  
  // 最終的な運勢スコア（0-100）
  const fortuneScore = Math.min(100, Math.max(1, Math.floor((baseLuck * 0.4 + elementScore * 0.4 + monthImpact * 0.2))));
  
  // ラッキーアイテムなど（日付と誕生日から一意に決定）
  const combinedValue = dateValue + birthValue;
  const luckyColorIndex = combinedValue % luckyColors.length;
  const luckyItemIndex = (combinedValue * 7) % luckyItems.length;
  const luckyNumber = 1 + (combinedValue % 99);
  
  let fortuneLevel;
  if (fortuneScore >= 80) {
    fortuneLevel = "絶好調";
  } else if (fortuneScore >= 60) {
    fortuneLevel = "好調";
  } else if (fortuneScore >= 40) {
    fortuneLevel = "普通";
  } else if (fortuneScore >= 20) {
    fortuneLevel = "やや不調";
  } else {
    fortuneLevel = "要注意";
  }
  
  // 運勢のアドバイス
  const advice = getDailyAdvice(todayKanshi);
  
  return {
    date: today.toISOString().split('T')[0],
    kanshi: todayKanshi,
    fortuneScore,
    fortuneLevel,
    luckyColor: luckyColors[luckyColorIndex],
    luckyItem: luckyItems[luckyItemIndex],
    luckyNumber,
    advice
  };
}

// 今日の干支を計算（簡易版）
function calculateTodayKanshi() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const day = today.getDate();
  
  // 干支の計算は複雑なため、簡略化
  const jikkan = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
  const junishi = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
  
  // 日数に基づく簡易計算
  const totalDays = Math.floor(Date.now() / 86400000); // 1970年からの経過日数
  
  const kan = jikkan[totalDays % 10];
  const shi = junishi[totalDays % 12];
  
  return kan + shi;
}

// 誕生日の干支を計算（簡易版）
function calculateBirthDateKanshi(birthdate) {
  const date = new Date(birthdate);
  const year = date.getFullYear();
  
  // 干支の計算は複雑なため、簡略化
  const jikkan = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
  const junishi = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
  
  const kanIndex = (year - 4) % 10;
  const shiIndex = (year - 4) % 12;
  
  return jikkan[kanIndex] + junishi[shiIndex];
}

// デイリー運勢API
router.post('/fortune', (req, res) => {
  try {
    const { userId, birthdate } = req.body;
    
    if (!birthdate) {
      return res.status(400).json({ success: false, message: '生年月日が必要です' });
    }
    
    const dailyFortune = calculateDailyFortune(birthdate);
    
    // ユーザーIDがある場合は結果を保存
    if (userId) {
      const userFilePath = path.join(usersDir, `${userId}.json`);
      
      if (fs.existsSync(userFilePath)) {
        // ファイル読み込み
        const encryptedData = JSON.parse(fs.readFileSync(userFilePath, 'utf8')).data;
        
        // データ復号化
        const decryptedBytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
        let userData = JSON.parse(decryptedBytes.toString(CryptoJS.enc.Utf8));
        
        // 今日の日付
        const today = new Date().toISOString().split('T')[0];
        
        // 既に今日の運勢を取得していないか確認
        const alreadyReadToday = userData.readings.some(reading => {
          return reading.type === 'daily' && reading.date.startsWith(today);
        });
        
        // まだ今日の運勢を取得していなければポイント付与
        if (!alreadyReadToday) {
          userData.points += 5; // デイリー運勢確認ボーナス
          
          // 運勢記録を追加
          userData.readings.push({
            type: 'daily',
            date: new Date().toISOString(),
            result: dailyFortune
          });
          
          // データ暗号化して保存
          const encryptedUpdatedData = CryptoJS.AES.encrypt(
            JSON.stringify(userData),
            SECRET_KEY
          ).toString();
          
          fs.writeFileSync(userFilePath, JSON.stringify({ data: encryptedUpdatedData }));
          
          dailyFortune.bonusPoints = 5; // ボーナスポイント情報を追加
        } else {
          dailyFortune.bonusPoints = 0; // 既に取得済み
        }
      }
    }
    
    res.json({
      success: true,
      dailyFortune
    });
  } catch (error) {
    console.error('デイリー運勢計算エラー:', error);
    res.status(500).json({ success: false, message: 'サーバーエラーが発生しました' });
  }
});

// ポイント履歴取得API
router.get('/points/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const userFilePath = path.join(usersDir, `${userId}.json`);
    
    if (!fs.existsSync(userFilePath)) {
      return res.status(404).json({ success: false, message: 'ユーザーが見つかりません' });
    }
    
    // ファイル読み込み
    const encryptedData = JSON.parse(fs.readFileSync(userFilePath, 'utf8')).data;
    
    // データ復号化
    const decryptedBytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
    const userData = JSON.parse(decryptedBytes.toString(CryptoJS.enc.Utf8));
    
    // ポイント関連情報を抽出
    const pointsInfo = {
      totalPoints: userData.points,
      loginStreak: userData.loginStreak,
      pointsHistory: userData.readings.filter(reading => reading.bonusPoints).map(reading => ({
        date: reading.date,
        type: reading.type,
        points: reading.bonusPoints || 0
      }))
    };
    
    res.json({
      success: true,
      pointsInfo
    });
  } catch (error) {
    console.error('ポイント履歴取得エラー:', error);
    res.status(500).json({ success: false, message: 'サーバーエラーが発生しました' });
  }
});

module.exports = router;
