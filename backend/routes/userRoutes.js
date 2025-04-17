const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const CryptoJS = require('crypto-js');

// ユーザーデータのディレクトリパス
const usersDir = path.join(__dirname, '..', 'data', 'users');

// ユーザー登録・認証用の秘密鍵（実際の環境では環境変数として設定することをお勧めします）
const SECRET_KEY = process.env.SECRET_KEY || 'sanmeigaku-secret-key';

// 新規ユーザー作成
router.post('/register', (req, res) => {
  try {
    const { name, birthdate, gender } = req.body;
    
    // バリデーション
    if (!name || !birthdate || !gender) {
      return res.status(400).json({ success: false, message: '必須項目が不足しています' });
    }
    
    // ユニークID生成
    const userId = uuidv4();
    
    // ユーザーデータの作成
    const userData = {
      id: userId,
      name,
      birthdate,
      gender,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      points: 0,
      loginStreak: 1,
      readings: []
    };
    
    // データ暗号化
    const encryptedData = CryptoJS.AES.encrypt(
      JSON.stringify(userData),
      SECRET_KEY
    ).toString();
    
    // ファイルに保存
    const userFilePath = path.join(usersDir, `${userId}.json`);
    fs.writeFileSync(userFilePath, JSON.stringify({ data: encryptedData }));
    
    res.status(201).json({
      success: true,
      userId,
      message: 'ユーザーが正常に作成されました'
    });
  } catch (error) {
    console.error('ユーザー作成エラー:', error);
    res.status(500).json({ success: false, message: 'サーバーエラーが発生しました' });
  }
});

// ユーザー情報取得
router.get('/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const userFilePath = path.join(usersDir, `${userId}.json`);
    
    // ファイルの存在確認
    if (!fs.existsSync(userFilePath)) {
      return res.status(404).json({ success: false, message: 'ユーザーが見つかりません' });
    }
    
    // ファイル読み込み
    const encryptedData = JSON.parse(fs.readFileSync(userFilePath, 'utf8')).data;
    
    // データ復号化
    const decryptedBytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
    const userData = JSON.parse(decryptedBytes.toString(CryptoJS.enc.Utf8));
    
    // 機密情報を除外
    delete userData.readings;  // 詳細な占い結果は別エンドポイントで提供
    
    res.json({
      success: true,
      user: userData
    });
  } catch (error) {
    console.error('ユーザー情報取得エラー:', error);
    res.status(500).json({ success: false, message: 'サーバーエラーが発生しました' });
  }
});

// ログイン（デイリーボーナス処理を含む）
router.post('/login', (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ success: false, message: 'ユーザーIDが必要です' });
    }
    
    const userFilePath = path.join(usersDir, `${userId}.json`);
    
    // ファイルの存在確認
    if (!fs.existsSync(userFilePath)) {
      return res.status(404).json({ success: false, message: 'ユーザーが見つかりません' });
    }
    
    // ファイル読み込み
    const encryptedData = JSON.parse(fs.readFileSync(userFilePath, 'utf8')).data;
    
    // データ復号化
    const decryptedBytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
    let userData = JSON.parse(decryptedBytes.toString(CryptoJS.enc.Utf8));
    
    // 最終ログイン日の確認
    const lastLogin = new Date(userData.lastLogin);
    const today = new Date();
    const isNewDay = lastLogin.getDate() !== today.getDate() || 
                     lastLogin.getMonth() !== today.getMonth() || 
                     lastLogin.getFullYear() !== today.getFullYear();
    
    // ポイントと連続ログイン処理
    if (isNewDay) {
      // 連続ログイン日数の計算
      const dayDiff = Math.floor((today - lastLogin) / (1000 * 60 * 60 * 24));
      if (dayDiff === 1) {
        // 連続ログイン
        userData.loginStreak += 1;
        
        // ボーナスポイント（5日ごとに追加ボーナス）
        const basePoints = 10;
        const streakBonus = userData.loginStreak % 5 === 0 ? 50 : 0;
        userData.points += basePoints + streakBonus;
      } else {
        // 連続ログインが途切れた
        userData.loginStreak = 1;
        userData.points += 10; // 基本ポイント
      }
      
      // 最終ログイン更新
      userData.lastLogin = today.toISOString();
      
      // データ暗号化して保存
      const encryptedData = CryptoJS.AES.encrypt(
        JSON.stringify(userData),
        SECRET_KEY
      ).toString();
      
      fs.writeFileSync(userFilePath, JSON.stringify({ data: encryptedData }));
    }
    
    // 機密情報を除外
    delete userData.readings;
    
    res.json({
      success: true,
      user: userData,
      dailyBonus: isNewDay ? {
        points: userData.loginStreak % 5 === 0 ? 60 : 10, // 基本10ポイント + 5日ごとに50ポイント
        streak: userData.loginStreak
      } : null
    });
  } catch (error) {
    console.error('ログインエラー:', error);
    res.status(500).json({ success: false, message: 'サーバーエラーが発生しました' });
  }
});

// ユーザーデータの削除
router.delete('/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const userFilePath = path.join(usersDir, `${userId}.json`);
    
    // ファイルの存在確認
    if (!fs.existsSync(userFilePath)) {
      return res.status(404).json({ success: false, message: 'ユーザーが見つかりません' });
    }
    
    // ファイル削除
    fs.unlinkSync(userFilePath);
    
    res.json({
      success: true,
      message: 'ユーザーデータが正常に削除されました'
    });
  } catch (error) {
    console.error('ユーザー削除エラー:', error);
    res.status(500).json({ success: false, message: 'サーバーエラーが発生しました' });
  }
});

module.exports = router;
