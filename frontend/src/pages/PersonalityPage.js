import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/PersonalityPage.css';

const PersonalityPage = ({ user }) => {
  const [personality, setPersonality] = useState(null);
  const [kanshi, setKanshi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    if (user) {
      fetchPersonalityData();
    }
  }, [user]);
  
  const fetchPersonalityData = async () => {
    try {
      const response = await fetch('/api/sanmei/personality', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          birthdate: user.birthdate
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setPersonality(data.personality);
        setKanshi(data.kanshi);
      } else {
        setError('性格データの取得に失敗しました');
      }
    } catch (error) {
      console.error('性格分析取得エラー:', error);
      setError('サーバーエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>データを分析しています...</p>
        </div>
      </div>
    );
  }
  
  if (!personality || !kanshi) {
    return (
      <div className="container">
        <div className="error-container">
          <h2>データが見つかりません</h2>
          <p>性格分析データの取得に失敗しました。後ほど再度お試しください。</p>
          <Link to="/dashboard" className="back-button">ダッシュボードに戻る</Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="personality-page">
      <div className="container">
        <h1 className="page-title">あなたの性格分析</h1>
        
        <div className="kanshi-card">
          <h2>あなたの干支</h2>
          <div className="kanshi-grid">
            <div className="kanshi-item">
              <h3>年干支</h3>
              <div className="kanshi-value">{kanshi.year}</div>
              <p className="kanshi-description">あなたの生まれ年の干支です。基本的な性格や運命を表します。</p>
            </div>
            <div className="kanshi-item">
              <h3>月干支</h3>
              <div className="kanshi-value">{kanshi.month}</div>
              <p className="kanshi-description">あなたの生まれ月の干支です。内面的な性質や社会との関わり方を表します。</p>
            </div>
            <div className="kanshi-item">
              <h3>日干支</h3>
              <div className="kanshi-value">{kanshi.day}</div>
              <p className="kanshi-description">あなたの生まれ日の干支です。自己表現やコミュニケーション方法を表します。</p>
            </div>
          </div>
        </div>
        
        <div className="personality-traits-card">
          <h2>基本的な性格特性</h2>
          <div className="traits-list">
            {personality.traits.map((trait, index) => (
              <div key={index} className="trait-item">{trait}</div>
            ))}
          </div>
        </div>
        
        <div className="strengths-weaknesses-grid">
          <div className="strengths-card">
            <h2>あなたの強み</h2>
            <ul>
              {personality.strengths.map((strength, index) => (
                <li key={index}>{strength}</li>
              ))}
            </ul>
          </div>
          
          <div className="weaknesses-card">
            <h2>課題と気をつけるべき点</h2>
            <ul>
              {personality.weaknesses.map((weakness, index) => (
                <li key={index}>{weakness}</li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="personality-explanation-card">
          <h2>算命学における性格解釈</h2>
          <p>
            算命学では、生年月日から導き出される「干支（かんし）」に基づいて、人の性格や運命を読み解きます。
            干支は「十干（じっかん）」と「十二支（じゅうにし）」の組み合わせで、それぞれが持つ五行（木・火・土・金・水）の
            性質によって、その人の個性や相性が決まるとされています。
          </p>
          <p>
            あなたの年干支である「{kanshi.year}」は全体的な運勢や基本的な性格を表し、
            月干支「{kanshi.month}」は家族関係や内面性を、
            日干支「{kanshi.day}」は対人関係や表現方法を表しています。
          </p>
          <p>
            これらの要素が絡み合うことで、あなただけの個性が形作られています。自分の強みを活かし、
            弱点を理解することで、より充実した人生を送ることができるでしょう。
          </p>
        </div>
        
        <div className="personality-tips-card">
          <h2>性格を活かすためのアドバイス</h2>
          <div className="tips-grid">
            <div className="tip-item">
              <div className="tip-icon">💼</div>
              <h3>仕事面</h3>
              <p>
                あなたの{personality.traits[0]}や{personality.traits[1]}を活かせる仕事で力を発揮できるでしょう。
                {personality.strengths[0]}を意識して取り組むと、成果につながります。
              </p>
            </div>
            <div className="tip-item">
              <div className="tip-icon">❤️</div>
              <h3>恋愛面</h3>
              <p>
                関係においては、{personality.strengths[1]}があなたの魅力となります。
                ただし、{personality.weaknesses[0]}には注意が必要です。
                自分の気持ちを素直に表現することを心がけましょう。
              </p>
            </div>
            <div className="tip-item">
              <div className="tip-icon">🌱</div>
              <h3>成長のために</h3>
              <p>
                {personality.weaknesses[1]}を改善するため、意識的に新しい経験を積むことが大切です。
                苦手なことにも少しずつ挑戦してみましょう。
              </p>
            </div>
          </div>
        </div>
        
        <div className="navigation-buttons">
          <Link to="/dashboard" className="nav-button">
            ダッシュボードに戻る
          </Link>
          <Link to="/compatibility" className="nav-button">
            相性診断を見る
          </Link>
        </div>
        
        {error && <p className="error-message">{error}</p>}
      </div>
    </div>
  );
};

export default PersonalityPage;
