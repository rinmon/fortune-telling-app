import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/DailyFortunePage.css';

const DailyFortunePage = ({ user }) => {
  const [dailyFortune, setDailyFortune] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bonusPoints, setBonusPoints] = useState(0);
  
  useEffect(() => {
    if (user) {
      fetchDailyFortune();
    }
  }, [user]);
  
  const fetchDailyFortune = async () => {
    try {
      const response = await fetch('/api/daily/fortune', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          birthdate: user.birthdate
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setDailyFortune(data.dailyFortune);
        if (data.dailyFortune.bonusPoints) {
          setBonusPoints(data.dailyFortune.bonusPoints);
        }
      } else {
        setError('運勢データの取得に失敗しました');
      }
    } catch (error) {
      console.error('デイリー運勢取得エラー:', error);
      setError('サーバーエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };
  
  // 日付をフォーマット
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    return new Date(dateString).toLocaleDateString('ja-JP', options);
  };
  
  if (loading) {
    return (
      <div className="container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>データを読み込んでいます...</p>
        </div>
      </div>
    );
  }
  
  if (!dailyFortune) {
    return (
      <div className="container">
        <div className="error-container">
          <h2>データが見つかりません</h2>
          <p>運勢データの取得に失敗しました。後ほど再度お試しください。</p>
          <Link to="/dashboard" className="back-button">ダッシュボードに戻る</Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="daily-fortune-page">
      <div className="container">
        <h1 className="page-title">今日の運勢</h1>
        <p className="fortune-date">{formatDate(dailyFortune.date)}</p>
        
        {bonusPoints > 0 && (
          <div className="bonus-points-alert">
            <div className="bonus-icon">🎁</div>
            <div className="bonus-content">
              <h3>デイリーボーナス獲得！</h3>
              <p>今日のログインで <strong>{bonusPoints}ポイント</strong> を獲得しました！</p>
              <p className="streak-info">現在 <strong>{user.loginStreak}日</strong> 連続ログイン中</p>
            </div>
          </div>
        )}
        
        <div className="fortune-overall-card">
          <h2>全体運</h2>
          <div className="fortune-score-display">
            <div className="fortune-level-badge">{dailyFortune.fortuneLevel}</div>
            <div className="fortune-score-bar">
              <div 
                className="fortune-score-fill" 
                style={{ width: `${dailyFortune.fortuneScore}%` }}
              ></div>
            </div>
            <div className="fortune-score-value">{dailyFortune.fortuneScore}点</div>
          </div>
          
          <div className="fortune-advice-card">
            <h3>今日のアドバイス</h3>
            <p>{dailyFortune.advice.overall}</p>
          </div>
        </div>
        
        <div className="fortune-details-grid">
          <div className="fortune-detail-card">
            <h3>仕事運</h3>
            <p>{dailyFortune.advice.work}</p>
          </div>
          
          <div className="fortune-detail-card">
            <h3>恋愛運</h3>
            <p>{dailyFortune.advice.love}</p>
          </div>
          
          <div className="fortune-detail-card">
            <h3>健康運</h3>
            <p>{dailyFortune.advice.health}</p>
          </div>
        </div>
        
        <div className="lucky-items-grid">
          <div className="lucky-item-card">
            <div className="lucky-item-icon">🎨</div>
            <h3>ラッキーカラー</h3>
            <div className="lucky-item-value">{dailyFortune.luckyColor}</div>
          </div>
          
          <div className="lucky-item-card">
            <div className="lucky-item-icon">🔮</div>
            <h3>ラッキーアイテム</h3>
            <div className="lucky-item-value">{dailyFortune.luckyItem}</div>
          </div>
          
          <div className="lucky-item-card">
            <div className="lucky-item-icon">🔢</div>
            <h3>ラッキーナンバー</h3>
            <div className="lucky-item-value">{dailyFortune.luckyNumber}</div>
          </div>
        </div>
        
        <div className="kanshi-info-card">
          <h2>今日の干支</h2>
          <div className="kanshi-value">{dailyFortune.kanshi}</div>
          <p className="kanshi-description">
            干支（かんし）は十干(天干)と十二支(地支)を組み合わせた暦の単位です。
            古来より占いの重要な要素とされてきました。
          </p>
        </div>
        
        <div className="sharing-section">
          <h2>占い結果をシェアする</h2>
          <p>今日の運勢を友達と共有しましょう</p>
          <div className="sharing-buttons">
            <button className="share-button share-twitter">
              <span className="share-icon">𝕏</span> Twitterでシェア
            </button>
            <button className="share-button share-line">
              <span className="share-icon">L</span> LINEでシェア
            </button>
            <button className="share-button share-facebook">
              <span className="share-icon">f</span> Facebookでシェア
            </button>
          </div>
        </div>
        
        <div className="navigation-buttons">
          <Link to="/dashboard" className="nav-button">
            ダッシュボードに戻る
          </Link>
          <Link to="/yearly" className="nav-button">
            年間運勢を見る
          </Link>
        </div>
        
        {error && <p className="error-message">{error}</p>}
      </div>
    </div>
  );
};

export default DailyFortunePage;
