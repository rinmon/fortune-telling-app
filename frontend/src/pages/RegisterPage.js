import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/RegisterPage.css';

const RegisterPage = ({ onRegister }) => {
  const [formData, setFormData] = useState({
    name: '',
    birthdate: '',
    gender: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    // 入力バリデーション
    if (!formData.name || !formData.birthdate || !formData.gender) {
      setError('全ての項目を入力してください');
      setLoading(false);
      return;
    }
    
    try {
      const response = await fetch('/api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // 登録成功後、ユーザーIDを含む完全なユーザーデータを取得
        const userResponse = await fetch(`/api/users/${data.userId}`);
        const userData = await userResponse.json();
        
        if (userData.success) {
          onRegister(userData.user);
          navigate('/dashboard');
        } else {
          throw new Error('ユーザーデータの取得に失敗しました');
        }
      } else {
        setError(data.message || '登録に失敗しました。もう一度お試しください。');
      }
    } catch (error) {
      console.error('登録エラー:', error);
      setError('サーバーエラーが発生しました。後でもう一度お試しください。');
    } finally {
      setLoading(false);
    }
  };
  
  // 今日の日付を取得して、生年月日の入力を制限
  const today = new Date().toISOString().split('T')[0];
  
  return (
    <div className="register-page">
      <div className="container">
        <div className="register-container">
          <h1 className="register-title">新規登録</h1>
          <p className="register-subtitle">
            算命学占いを始めるために、以下の情報を入力してください
          </p>
          
          <form onSubmit={handleSubmit} className="register-form">
            <div className="form-group">
              <label htmlFor="name">お名前</label>
              <input
                type="text"
                id="name"
                name="name"
                className="form-control"
                value={formData.name}
                onChange={handleChange}
                placeholder="例：山田 太郎"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="birthdate">生年月日</label>
              <input
                type="date"
                id="birthdate"
                name="birthdate"
                className="form-control"
                value={formData.birthdate}
                onChange={handleChange}
                max={today}
                required
              />
              <small className="form-text">
                算命学の計算に必要です。正確な日付を入力してください。
              </small>
            </div>
            
            <div className="form-group">
              <label>性別</label>
              <div className="gender-options">
                <label className="gender-option">
                  <input
                    type="radio"
                    name="gender"
                    value="male"
                    checked={formData.gender === 'male'}
                    onChange={handleChange}
                    required
                  />
                  <span>男性</span>
                </label>
                <label className="gender-option">
                  <input
                    type="radio"
                    name="gender"
                    value="female"
                    checked={formData.gender === 'female'}
                    onChange={handleChange}
                    required
                  />
                  <span>女性</span>
                </label>
                <label className="gender-option">
                  <input
                    type="radio"
                    name="gender"
                    value="other"
                    checked={formData.gender === 'other'}
                    onChange={handleChange}
                    required
                  />
                  <span>その他</span>
                </label>
              </div>
            </div>
            
            {error && <p className="error-message">{error}</p>}
            
            <div className="form-footer">
              <button 
                type="submit" 
                className="register-button" 
                disabled={loading}
              >
                {loading ? '登録中...' : '無料で登録する'}
              </button>
              
              <p className="login-link">
                すでにアカウントをお持ちですか？ <Link to="/">ログインする</Link>
              </p>
            </div>
          </form>
          
          <div className="register-info">
            <h3>登録後にできること</h3>
            <ul>
              <li>毎日の運勢チェック（ポイント獲得）</li>
              <li>本格的な性格分析</li>
              <li>年間運勢の詳細予測</li>
              <li>恋愛相性診断</li>
              <li>ポイントを貯めて特別な占いをアンロック</li>
            </ul>
            <p className="privacy-note">
              ※ご入力いただいた情報は占い結果の算出のみに使用され、厳重に保護されます。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
