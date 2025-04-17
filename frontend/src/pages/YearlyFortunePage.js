import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import { Radar } from 'react-chartjs-2';
import '../styles/YearlyFortunePage.css';

// Chart.js登録
ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const YearlyFortunePage = ({ user }) => {
  const [yearlyFortune, setYearlyFortune] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // 年を選択するためのオプション（今年から前後3年）
  const currentYear = new Date().getFullYear();
  const yearOptions = [
    currentYear - 3,
    currentYear - 2,
    currentYear - 1,
    currentYear,
    currentYear + 1,
    currentYear + 2,
    currentYear + 3
  ];
  
  useEffect(() => {
    if (user) {
      fetchYearlyFortune();
    }
  }, [user, selectedYear]);
  
  const fetchYearlyFortune = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/sanmei/fortune', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          birthdate: user.birthdate,
          targetYear: selectedYear
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setYearlyFortune(data.fortune);
      } else {
        setError('年間運勢データの取得に失敗しました');
      }
    } catch (error) {
      console.error('年間運勢取得エラー:', error);
      setError('サーバーエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };
  
  // チャートデータの準備
  const prepareChartData = () => {
    if (!yearlyFortune) return null;
    
    return {
      labels: ['全体運', '仕事運', '恋愛運', '健康運'],
      datasets: [
        {
          label: `${selectedYear}年の運勢`,
          data: [
            yearlyFortune.overall.score,
            yearlyFortune.work.score,
            yearlyFortune.love.score,
            yearlyFortune.health.score
          ],
          backgroundColor: 'rgba(75, 0, 130, 0.2)',
          borderColor: 'rgba(75, 0, 130, 1)',
          borderWidth: 2,
          pointBackgroundColor: 'rgba(75, 0, 130, 1)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgba(75, 0, 130, 1)'
        }
      ]
    };
  };
  
  // チャートのオプション
  const chartOptions = {
    scales: {
      r: {
        angleLines: {
          display: true
        },
        suggestedMin: 0,
        suggestedMax: 100
      }
    }
  };
  
  if (loading) {
    return (
      <div className="container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>運勢データを計算しています...</p>
        </div>
      </div>
    );
  }
  
  if (!yearlyFortune) {
    return (
      <div className="container">
        <div className="error-container">
          <h2>データが見つかりません</h2>
          <p>年間運勢データの取得に失敗しました。後ほど再度お試しください。</p>
          <Link to="/dashboard" className="back-button">ダッシュボードに戻る</Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="yearly-fortune-page">
      <div className="container">
        <h1 className="page-title">年間運勢</h1>
        
        <div className="year-selector">
          <label htmlFor="year-select">表示する年:</label>
          <select 
            id="year-select" 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="year-select"
          >
            {yearOptions.map(year => (
              <option key={year} value={year}>{year}年</option>
            ))}
          </select>
        </div>
        
        <div className="fortune-cycle-card">
          <h2>現在のライフサイクル</h2>
          <div className="cycle-badge">{yearlyFortune.fortuneCycle}</div>
          <p className="cycle-description">
            あなたは現在「{yearlyFortune.fortuneCycle}」の段階にいます。
            これは人生の中で、特定の特性や課題が現れる時期を表しています。
          </p>
        </div>
        
        <div className="yearly-fortune-chart-card">
          <h2>{selectedYear}年の運勢チャート</h2>
          <div className="chart-container">
            <Radar data={prepareChartData()} options={chartOptions} />
          </div>
        </div>
        
        <div className="fortune-details-section">
          <div className="fortune-detail-card overall">
            <h2>全体運: {yearlyFortune.overall.result}</h2>
            <div className="fortune-score-meter">
              <div 
                className="fortune-score-fill" 
                style={{ width: `${yearlyFortune.overall.score}%` }}
              ></div>
            </div>
            <p className="fortune-advice">{yearlyFortune.overall.advice}</p>
          </div>
          
          <div className="fortune-categories">
            <div className="fortune-category-card">
              <div className="category-icon">💼</div>
              <h3>仕事運: {yearlyFortune.work.result}</h3>
              <div className="fortune-score-meter">
                <div 
                  className="fortune-score-fill" 
                  style={{ width: `${yearlyFortune.work.score}%` }}
                ></div>
              </div>
              <p className="fortune-advice">{yearlyFortune.work.advice}</p>
            </div>
            
            <div className="fortune-category-card">
              <div className="category-icon">❤️</div>
              <h3>恋愛運: {yearlyFortune.love.result}</h3>
              <div className="fortune-score-meter">
                <div 
                  className="fortune-score-fill" 
                  style={{ width: `${yearlyFortune.love.score}%` }}
                ></div>
              </div>
              <p className="fortune-advice">{yearlyFortune.love.advice}</p>
            </div>
            
            <div className="fortune-category-card">
              <div className="category-icon">🌱</div>
              <h3>健康運: {yearlyFortune.health.result}</h3>
              <div className="fortune-score-meter">
                <div 
                  className="fortune-score-fill" 
                  style={{ width: `${yearlyFortune.health.score}%` }}
                ></div>
              </div>
              <p className="fortune-advice">{yearlyFortune.health.advice}</p>
            </div>
          </div>
        </div>
        
        <div className="kanshi-info-card">
          <h2>あなたの干支情報</h2>
          <div className="kanshi-info-grid">
            <div className="kanshi-info-item">
              <h3>年干支</h3>
              <div className="kanshi-value">{yearlyFortune.kanshi.year}</div>
            </div>
            <div className="kanshi-info-item">
              <h3>月干支</h3>
              <div className="kanshi-value">{yearlyFortune.kanshi.month}</div>
            </div>
            <div className="kanshi-info-item">
              <h3>日干支</h3>
              <div className="kanshi-value">{yearlyFortune.kanshi.day}</div>
            </div>
          </div>
        </div>
        
        <div className="yearly-advice-card">
          <h2>{selectedYear}年を充実させるためのアドバイス</h2>
          <div className="advice-content">
            <p>
              あなたの干支「{yearlyFortune.kanshi.year}」と{selectedYear}年の相性を考慮すると、
              この1年は特に{yearlyFortune.overall.score >= 70 ? '恵まれた' : 
              yearlyFortune.overall.score >= 50 ? '安定した' : '慎重に進むべき'}時期です。
            </p>
            <p>
              {yearlyFortune.work.score > yearlyFortune.love.score ? 
                '仕事面での成長が期待できる年です。新しいスキルの習得や、キャリアアップの機会を積極的に探してみましょう。' : 
                '人間関係や感情面での充実が期待できる年です。新しい出会いや、既存の関係の深化に注目してみましょう。'}
            </p>
            <p>
              {yearlyFortune.health.score < 60 ? 
                '健康面には特に注意が必要です。十分な休息と規則正しい生活を心がけましょう。' : 
                '健康面は安定していますが、定期的な運動や健康的な食生活を続けることで、さらに良い状態を維持できるでしょう。'}
            </p>
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

export default YearlyFortunePage;
