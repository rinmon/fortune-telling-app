/**
 * 算命学占いアプリケーション API連携機能
 * サーバーとの通信を担当するモジュール
 */

// APIエンドポイントのベースURL
const API_BASE_URL = window.location.origin;

/**
 * ユーザー初期化APIを呼び出す
 * 初回アクセス時に新規ユーザーIDを取得、既存ユーザーの場合は認証を行う
 * @returns {Promise<Object>} ユーザー情報
 */
async function initUser() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/user/init`);
    if (!response.ok) {
      throw new Error('ユーザー初期化に失敗しました');
    }
    return await response.json();
  } catch (error) {
    console.error('ユーザー初期化エラー:', error);
    // オフラインモードのためのフォールバック
    return { userId: 'offline-' + Date.now(), isNewUser: true, offline: true };
  }
}

/**
 * 占い結果をサーバーに保存する
 * @param {Object} result - 占い結果データ
 * @returns {Promise<Object>} 保存結果
 */
async function saveFortuneResult(result) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/user/save-result`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(result),
    });

    if (!response.ok) {
      throw new Error('占い結果の保存に失敗しました');
    }
    return await response.json();
  } catch (error) {
    console.error('占い結果保存エラー:', error);
    // ローカルストレージへのフォールバック
    return { success: false, error: error.message, offline: true };
  }
}

/**
 * ユーザーの占い結果履歴を取得する
 * @returns {Promise<Array>} 過去の占い結果一覧
 */
async function getFortuneResults() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/user/results`);
    if (!response.ok) {
      throw new Error('占い結果の取得に失敗しました');
    }
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('占い結果取得エラー:', error);
    // ローカルストレージからのフォールバック
    return getLocalFortuneResults();
  }
}

/**
 * ローカルストレージから占い結果を取得する（オフラインモード用）
 * @returns {Array} 占い結果の配列
 */
function getLocalFortuneResults() {
  try {
    const results = JSON.parse(localStorage.getItem('fortuneResults')) || [];
    return results;
  } catch (error) {
    console.error('ローカルストレージ読み込みエラー:', error);
    return [];
  }
}

/**
 * 統計データを管理者用に取得する（管理ページ用）
 * @returns {Promise<Object>} 統計データ
 */
async function getStats() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/stats`);
    if (!response.ok) {
      throw new Error('統計データの取得に失敗しました');
    }
    return await response.json();
  } catch (error) {
    console.error('統計データ取得エラー:', error);
    return null;
  }
}

// グローバル変数として公開
window.api = {
  initUser,
  saveFortuneResult,
  getFortuneResults,
  getStats
};
