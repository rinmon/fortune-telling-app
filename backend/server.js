const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const cookieParser = require('cookie-parser');

// アプリケーションの初期化
const app = express();
const PORT = process.env.PORT || 5001;

// ミドルウェアの設定
app.use(helmet({
  contentSecurityPolicy: false, // 開発中は無効化（実際のデプロイ時には有効にする）
})); 
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// 静的ファイル配信

app.use(express.static(path.join(__dirname, '../frontend')));

// データディレクトリの確認と作成
const dataDir = path.join(__dirname, 'data');
const usersDir = path.join(dataDir, 'users');
const statsFile = path.join(dataDir, 'stats.json');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

if (!fs.existsSync(usersDir)) {
  fs.mkdirSync(usersDir);
}

// 統計データの初期化
if (!fs.existsSync(statsFile)) {
  const initialStats = {
    totalVisits: 0,
    uniqueUsers: 0,
    fortuneCount: {
      basic: 0,
      'time-fortune': 0
    },
    dailyStats: {}
  };
  fs.writeFileSync(statsFile, JSON.stringify(initialStats, null, 2));
}

// ユーザーIDを生成する関数
function generateUserId() {
  return crypto.randomBytes(16).toString('hex');
}

// ユーザーデータファイルパスを取得
function getUserDataPath(userId) {
  return path.join(usersDir, `${userId}.json`);
}

// ユーザーデータを取得する関数
function getUserData(userId) {
  const userPath = getUserDataPath(userId);
  if (fs.existsSync(userPath)) {
    try {
      const data = fs.readFileSync(userPath, 'utf8');
      return JSON.parse(data);
    } catch (err) {
      console.error('Error reading user data:', err);
      return null;
    }
  }
  return null;
}

// ユーザーデータを保存する関数
function saveUserData(userId, data) {
  const userPath = getUserDataPath(userId);
  try {
    fs.writeFileSync(userPath, JSON.stringify(data, null, 2));
    return true;
  } catch (err) {
    console.error('Error saving user data:', err);
    return false;
  }
}

// 統計データを更新する関数
function updateStats(type, isNewUser = false) {
  try {
    const stats = JSON.parse(fs.readFileSync(statsFile, 'utf8'));
    const today = new Date().toISOString().split('T')[0];
    
    // 総訪問数を更新
    stats.totalVisits++;
    
    // 新規ユーザーの場合はユニークユーザー数を更新
    if (isNewUser) {
      stats.uniqueUsers++;
    }
    
    // 占いタイプ別のカウントを更新
    if (type) {
      stats.fortuneCount[type] = (stats.fortuneCount[type] || 0) + 1;
    }
    
    // 日別統計を更新
    if (!stats.dailyStats[today]) {
      stats.dailyStats[today] = { visits: 0, newUsers: 0, fortunes: { basic: 0, 'time-fortune': 0 } };
    }
    
    stats.dailyStats[today].visits++;
    if (isNewUser) {
      stats.dailyStats[today].newUsers++;
    }
    if (type) {
      stats.dailyStats[today].fortunes[type] = (stats.dailyStats[today].fortunes[type] || 0) + 1;
    }
    
    fs.writeFileSync(statsFile, JSON.stringify(stats, null, 2));
    return true;
  } catch (err) {
    console.error('Error updating stats:', err);
    return false;
  }
}

// APIエンドポイント

// ユーザー認証と初期化
app.get('/api/user/init', (req, res) => {
  let userId = req.cookies.userId;
  let isNewUser = false;
  
  // ユーザーIDがない場合は新規作成
  if (!userId) {
    userId = generateUserId();
    isNewUser = true;
    
    // 初期ユーザーデータの作成
    const initialUserData = {
      userId,
      createdAt: new Date().toISOString(),
      lastVisit: new Date().toISOString(),
      visits: 1,
      fortuneResults: []
    };
    
    // ユーザーデータを保存
    saveUserData(userId, initialUserData);
    
    // 統計更新
    updateStats(null, true);
  } else {
    // 既存ユーザーの場合、データを更新
    const userData = getUserData(userId) || {
      userId,
      createdAt: new Date().toISOString(),
      lastVisit: new Date().toISOString(),
      visits: 0,
      fortuneResults: []
    };
    
    userData.lastVisit = new Date().toISOString();
    userData.visits++;
    saveUserData(userId, userData);
    
    // 統計更新
    updateStats();
  }
  
  // クッキーを設定（30日間有効）
  res.cookie('userId', userId, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true, sameSite: 'strict' });
  
  res.json({ userId, isNewUser });
});

// 占い結果の保存
app.post('/api/user/save-result', (req, res) => {
  const userId = req.cookies.userId;
  const fortuneResult = req.body;
  
  if (!userId) {
    return res.status(401).json({ error: 'User ID not found' });
  }
  
  // ユーザーデータを取得
  let userData = getUserData(userId);
  if (!userData) {
    return res.status(404).json({ error: 'User data not found' });
  }
  
  // 結果にタイムスタンプとIDを追加
  fortuneResult.saveTime = new Date().toISOString();
  fortuneResult.resultId = crypto.randomBytes(8).toString('hex');
  
  // 占い結果を保存
  userData.fortuneResults.unshift(fortuneResult); // 最新を先頭に追加
  
  // 結果の数を制限（50件まで保存）
  if (userData.fortuneResults.length > 50) {
    userData.fortuneResults = userData.fortuneResults.slice(0, 50);
  }
  
  // ユーザーデータを保存
  if (saveUserData(userId, userData)) {
    // 統計更新
    updateStats(fortuneResult.type);
    res.json({ success: true, resultId: fortuneResult.resultId });
  } else {
    res.status(500).json({ error: 'Failed to save fortune result' });
  }
});

// ユーザーの占い結果を取得
app.get('/api/user/results', (req, res) => {
  const userId = req.cookies.userId;
  
  if (!userId) {
    return res.status(401).json({ error: 'User ID not found' });
  }
  
  // ユーザーデータを取得
  const userData = getUserData(userId);
  if (!userData) {
    return res.status(404).json({ error: 'User data not found' });
  }
  
  res.json({ results: userData.fortuneResults });
});

// 管理者向け統計API
app.get('/api/admin/stats', (req, res) => {
  // 実際のアプリでは、ここに管理者認証を実装する
  try {
    const stats = JSON.parse(fs.readFileSync(statsFile, 'utf8'));
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve statistics' });
  }
});

// ルートアクセスとその他のすべてのパスでindex.htmlを返す
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ルートの設定
app.use('/api/sanmei', require('./routes/sanmeiRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/daily', require('./routes/dailyRoutes'));
app.use('/api/fortune', require('./routes/fortune'));

// サーバーの起動
app.listen(PORT, () => {
  console.log(`サーバーが起動しました: http://localhost:${PORT}`);
});

// 未処理のエラーハンドリング
process.on('unhandledRejection', (err) => {
  console.log('未処理の拒否:', err);
});
