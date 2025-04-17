import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/DashboardPage.css';

const DashboardPage = ({ user }) => {
  const [dailyFortune, setDailyFortune] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    // ユーザーがログインしている場合、デイリー運勢を取得
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
  
  return (
    <div className="dashboard-page">
      <div className="container">
        <h1 className="page-title">ダッシュボード</h1>
        <p className="welcome-message">ようこそ、{user.name}さん！</p>
        
        <div className="dashboard-grid">
          <div className="dashboard-main">
            {/* デイリー運勢サマリー */}
            {dailyFortune && (
              <div className="fortune-summary-card">
                <div className="fortune-summary-header">
                  <h2>今日の運勢</h2>
                  <span className="fortune-date">{formatDate(dailyFortune.date)}</span>
                </div>
                
                <div className="fortune-score-display">
                  <div className="fortune-score-meter">
                    <div 
                      className="fortune-score-fill" 
                      style={{ width: `${dailyFortune.fortuneScore}%` }}
                    ></div>
                  </div>
                  <div className="fortune-level">{dailyFortune.fortuneLevel}</div>
                </div>
                
                <div className="fortune-advice">
                  <p>{dailyFortune.advice.overall}</p>
                </div>
                
                <div className="lucky-items-section">
                  <div className="lucky-item">
                    <span className="lucky-item-label">ラッキーカラー</span>
                    <span className="lucky-item-value">{dailyFortune.luckyColor}</span>
                  </div>
                  <div className="lucky-item">
                    <span className="lucky-item-label">ラッキーアイテム</span>
                    <span className="lucky-item-value">{dailyFortune.luckyItem}</span>
                  </div>
                  <div className="lucky-item">
                    <span className="lucky-item-label">ラッキーナンバー</span>
                    <span className="lucky-item-value">{dailyFortune.luckyNumber}</span>
                  </div>
                </div>
                
                <Link to="/daily" className="view-details-btn">
                  詳細を見る
                </Link>
              </div>
            )}
            
            {/* ポイント情報 */}
            <div className="points-card">
              <h2>ポイント状況</h2>
              <div className="points-info">
                <div className="total-points">
                  <span className="points-value">{user.points}</span>
                  <span className="points-label">ポイント</span>
                </div>
                <div className="login-streak">
                  <span className="streak-value">{user.loginStreak}</span>
                  <span className="streak-label">日連続ログイン</span>
                </div>
              </div>
              <div className="points-note">
                <p>毎日ログインして運勢をチェックすると、ポイントが貯まります。</p>
                <p>5日連続ログインごとにボーナスポイントがもらえます！</p>
              </div>
            </div>
          </div>
          
          <div className="dashboard-sidebar">
            {/* 占いメニュー */}
            <div className="menu-card">
              <h2>占いメニュー</h2>
              <ul className="fortune-menu">
                <li>
                  <Link to="/daily" className="menu-item">
                    <div className="menu-icon">📅</div>
                    <div className="menu-content">
                      <h3>今日の運勢</h3>
                      <p>今日の運勢や過ごし方のアドバイスをチェック</p>
                    </div>
                  </Link>
                </li>
                <li>
                  <Link to="/personality" className="menu-item">
                    <div className="menu-icon">🧠</div>
                    <div className="menu-content">
                      <h3>性格分析</h3>
                      <p>あなたの強み、弱み、才能を詳しく分析</p>
                    </div>
                  </Link>
                </li>
                <li>
                  <Link to="/yearly" className="menu-item">
                    <div className="menu-icon">🌟</div>
                    <div className="menu-content">
                      <h3>年間運勢</h3>
                      <p>仕事運、恋愛運、健康運など総合的な運勢予測</p>
                    </div>
                  </Link>
                </li>
                <li>
                  <Link to="/compatibility" className="menu-item">
                    <div className="menu-icon">💖</div>
                    <div className="menu-content">
                      <h3>恋愛相性</h3>
                      <p>気になる人との相性を診断</p>
                    </div>
                  </Link>
                </li>
              </ul>
            </div>
            
            {/* 干支情報 */}
            {dailyFortune && (
              <div className="kanshi-card">
                <h2>あなたの干支</h2>
                <div className="kanshi-info">
                  <p>本日の干支: <strong>{dailyFortune.kanshi}</strong></p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {error && <p className="error-message">{error}</p>}
      </div>
    </div>
  );
};

export default DashboardPage;
