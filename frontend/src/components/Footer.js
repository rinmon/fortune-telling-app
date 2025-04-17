import React from 'react';
import '../styles/Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-info">
            <h3 className="footer-title">算命学占い</h3>
            <p className="footer-description">
              生年月日に基づいた本格的な算命学占いを提供しています。
              あなたの運勢、性格、相性を詳しく分析します。
            </p>
          </div>
          
          <div className="footer-links">
            <h4>メニュー</h4>
            <ul>
              <li><a href="/">ホーム</a></li>
              <li><a href="/daily">今日の運勢</a></li>
              <li><a href="/personality">性格分析</a></li>
              <li><a href="/yearly">年間運勢</a></li>
              <li><a href="/compatibility">恋愛相性</a></li>
            </ul>
          </div>
          
          <div className="footer-links">
            <h4>お役立ち</h4>
            <ul>
              <li><a href="#about">算命学とは</a></li>
              <li><a href="#usage">使い方ガイド</a></li>
              <li><a href="#privacy">プライバシーポリシー</a></li>
              <li><a href="#terms">利用規約</a></li>
              <li><a href="#contact">お問い合わせ</a></li>
            </ul>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; {currentYear} 算命学占い. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
