import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Header.css';

const Header = ({ user, onLogout }) => {
  const navigate = useNavigate();
  
  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <Link to="/" className="logo">
            算命学占い
          </Link>
          
          <nav className="nav">
            {user ? (
              <>
                <Link to="/dashboard" className="nav-link">ダッシュボード</Link>
                <Link to="/daily" className="nav-link">今日の運勢</Link>
                <Link to="/personality" className="nav-link">性格分析</Link>
                <Link to="/yearly" className="nav-link">年間運勢</Link>
                <Link to="/compatibility" className="nav-link">恋愛相性</Link>
                
                <div className="user-menu">
                  <span className="username">{user.name}さん</span>
                  <span className="points">{user.points}ポイント</span>
                  <button onClick={onLogout} className="logout-btn">ログアウト</button>
                </div>
              </>
            ) : (
              <>
                <button 
                  onClick={() => navigate('/register')} 
                  className="register-btn"
                >
                  無料登録
                </button>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
