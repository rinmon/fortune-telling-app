import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import DailyFortunePage from './pages/DailyFortunePage';
import PersonalityPage from './pages/PersonalityPage';
import YearlyFortunePage from './pages/YearlyFortunePage';
import CompatibilityPage from './pages/CompatibilityPage';
import Header from './components/Header';
import Footer from './components/Footer';
import './styles/App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  // ローカルストレージからユーザー情報を取得
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    
    if (userId) {
      // ユーザーIDが保存されている場合、ログイン処理を行う
      fetchUserData(userId);
    } else {
      setLoading(false);
    }
  }, []);
  
  // ユーザーデータを取得する関数
  const fetchUserData = async (userId) => {
    try {
      const response = await fetch(`/api/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setUser(data.user);
        // デイリーボーナスがあれば表示するロジックをここに追加
      } else {
        // エラーがあれば、ローカルストレージをクリア
        localStorage.removeItem('userId');
      }
    } catch (error) {
      console.error('ログインエラー:', error);
      localStorage.removeItem('userId');
    } finally {
      setLoading(false);
    }
  };
  
  // ログイン処理
  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('userId', userData.id);
    navigate('/dashboard');
  };
  
  // ログアウト処理
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('userId');
    navigate('/');
  };
  
  if (loading) {
    return <div className="loading-container">読み込み中...</div>;
  }
  
  return (
    <div className="app">
      <Header user={user} onLogout={handleLogout} />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage onLogin={handleLogin} user={user} />} />
          <Route path="/register" element={<RegisterPage onRegister={handleLogin} />} />
          <Route 
            path="/dashboard" 
            element={
              user ? <DashboardPage user={user} /> : <HomePage onLogin={handleLogin} />
            } 
          />
          <Route 
            path="/daily" 
            element={
              user ? <DailyFortunePage user={user} /> : <HomePage onLogin={handleLogin} />
            } 
          />
          <Route 
            path="/personality" 
            element={
              user ? <PersonalityPage user={user} /> : <HomePage onLogin={handleLogin} />
            } 
          />
          <Route 
            path="/yearly" 
            element={
              user ? <YearlyFortunePage user={user} /> : <HomePage onLogin={handleLogin} />
            } 
          />
          <Route 
            path="/compatibility" 
            element={
              user ? <CompatibilityPage user={user} /> : <HomePage onLogin={handleLogin} />
            } 
          />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
