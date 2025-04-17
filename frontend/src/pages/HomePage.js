import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/HomePage.css';

const HomePage = ({ onLogin, user }) => {
  const [userId, setUserId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  // ユーザーがすでにログインしている場合はダッシュボードにリダイレクト
  if (user) {
    navigate('/dashboard');
    return null;
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        onLogin(data.user);
      } else {
        setError(data.message || 'ログインに失敗しました。IDを確認してください。');
      }
    } catch (error) {
      console.error('ログインエラー:', error);
      setError('サーバーエラーが発生しました。後でもう一度お試しください。');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="homepage">
      <div className="hero-section">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">算命学で解き明かす、あなたの運命の道</h1>
            <p className="hero-subtitle">
              生年月日から導く本格的な占いで、あなたの性格、運勢、相性を詳しく分析します
            </p>
            <div className="hero-buttons">
              <Link to="/register" className="btn-hero-register">無料で運命を診断する</Link>
              <button onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })} className="btn-hero-learn">
                詳しく見る
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <section id="features" className="features-section">
        <div className="container">
          <h2 className="section-title">算命学占いの特徴</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🔮</div>
              <h3>本格的な算命学</h3>
              <p>生年月日から導き出される干支や星座に基づく、伝統的な中国占術を現代に活かした本格占いです。</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>詳細な性格分析</h3>
              <p>あなたの強み、弱み、才能を詳細に分析し、自己理解を深めるお手伝いをします。</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🌟</div>
              <h3>運勢予測</h3>
              <p>全体運、恋愛運、仕事運、健康運など、多角的な視点からあなたの運勢を予測します。</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💖</div>
              <h3>相性占い</h3>
              <p>大切な人との相性を五行の相生相剋から分析し、より良い関係構築のヒントを提供します。</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>毎日の運勢</h3>
              <p>デイリー運勢チェックで今日の過ごし方のヒントを取得。毎日ログインでポイントも貯まります。</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎁</div>
              <h3>ポイントシステム</h3>
              <p>継続利用でポイントが貯まり、特別な占いやアドバイスがアンロックされていきます。</p>
            </div>
          </div>
        </div>
      </section>
      
      <section className="login-section">
        <div className="container">
          <div className="login-card">
            <h2 className="login-title">ログイン</h2>
            <p className="login-subtitle">すでに登録済みの方はIDを入力してください</p>
            
            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="userId">ユーザーID</label>
                <input
                  type="text"
                  id="userId"
                  className="form-control"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  required
                />
              </div>
              
              {error && <p className="error-message">{error}</p>}
              
              <button 
                type="submit" 
                className="login-button" 
                disabled={loading}
              >
                {loading ? 'ログイン中...' : 'ログイン'}
              </button>
            </form>
            
            <p className="register-link">
              まだ登録していませんか？ <Link to="/register">無料登録する</Link>
            </p>
          </div>
        </div>
      </section>
      
      <section className="testimonials-section">
        <div className="container">
          <h2 className="section-title">利用者の声</h2>
          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="testimonial-text">
                「初めは半信半疑でしたが、性格分析が本当に的確で驚きました。日々の運勢チェックが習慣になっています」
              </div>
              <div className="testimonial-author">田中さん (32歳)</div>
            </div>
            <div className="testimonial-card">
              <div className="testimonial-text">
                「恋愛相性占いを使って、彼との関係について理解が深まりました。アドバイスが具体的で参考になります」
              </div>
              <div className="testimonial-author">佐藤さん (28歳)</div>
            </div>
            <div className="testimonial-card">
              <div className="testimonial-text">
                「毎日のラッキーアイテムを参考にしています。不思議と物事がうまく進むようになりました」
              </div>
              <div className="testimonial-author">鈴木さん (41歳)</div>
            </div>
          </div>
        </div>
      </section>
      
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">今すぐ運命の扉を開こう</h2>
            <p className="cta-subtitle">
              無料登録して、あなただけの詳細な算命学占いを体験しましょう
            </p>
            <Link to="/register" className="cta-button">無料で始める</Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
