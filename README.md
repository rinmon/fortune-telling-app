# 算命学ウェブアプリケーション

本アプリケーションは、生年月日に基づいた算命学の占いを提供する本格的なウェブアプリケーションです。

## 機能

- **性格分析**: 生年月日から導き出される基本的な性格や傾向
- **運命の流れ**: 人生全体の運勢や特定の時期の予測
- **テーマ別占い**: 恋愛運、仕事運、健康運などの専門占い
- **定期的な運勢**: 毎日の運勢や月間の運勢の提供
- **データ管理**: JSONファイルでのユーザーデータ保存（データベース不要）
- **継続機能**: デイリーボーナスやポイントシステムによる継続利用のモチベーション向上

## 技術スタック

- **フロントエンド**: React.js, HTML5, CSS3, JavaScript
- **バックエンド**: Node.js, Express
- **データ保存**: JSONファイル形式
- **視覚化**: Chart.js
- **セキュリティ**: データ暗号化、安全なユーザー識別

## プロジェクト構造

```
sanmeigaku-app/
├── frontend/           # Reactフロントエンド
│   ├── public/         # 静的ファイル
│   └── src/            # ソースコード
│       ├── components/ # UIコンポーネント
│       ├── pages/      # ページコンポーネント
│       ├── utils/      # ユーティリティ関数
│       └── styles/     # CSSスタイル
├── backend/            # Node.jsバックエンド
│   ├── routes/         # APIルート
│   ├── controllers/    # ルートコントローラー
│   ├── models/         # データモデル
│   ├── utils/          # ユーティリティ関数
│   └── data/           # JSONデータファイル
└── docs/               # ドキュメント
```

## 開発環境のセットアップ

1. リポジトリをクローン
2. `npm install`で依存関係をインストール
3. `.env.example`をコピーして`.env`を作成し、環境変数を設定
4. `npm start`でアプリケーションを起動

## AWS Lightsailへのデプロイ手順

### 1. プロジェクトファイルの準備

```bash
# 必要なファイルはすべて含まれていますが、デプロイ前にビルドが必要あれば実行
$ npm install
```

### 2. AWS Lightsailインスタンスの作成

1. AWS Lightsailコンソールにログイン
2. 「インスタンス」→「インスタンスを作成」をクリック
3. プラットフォームとして「Linux/Unix」を選択
4. ブループリントとして「Node.js」を選択
5. インスタンスプランを選択（最小でも$5/月プランで動作可能）
6. インスタンス名を入力（例: fortune-telling-app）
7. 「インスタンスを作成」をクリック

### 3. コードのデプロイ

#### SFTPでファイルをアップロードする場合：

1. LightsailコンソールからSSHキーをダウンロード
2. 好みのSFTPクライアント（FileZillaなど）で接続
3. プロジェクトファイルを`/opt/bitnami/apache2/htdocs`にアップロード

#### Gitを使用する場合：

1. SSHでインスタンスに接続
2. 以下のコマンドを実行：

```bash
$ cd /opt/bitnami/apache2/htdocs
$ git clone リポジトリのURL .
$ npm install
$ cp .env.example .env
$ nano .env  # 環境変数を編集
```

### 4. 環境変数の設定

`.env`ファイルに以下の設定を行います：

```
PORT=8080
NODE_ENV=production
ADMIN_SECRET=安全なランダムな文字列
```

### 5. アプリケーションの起動

SSHで接続し、以下のコマンドを実行：

```bash
$ cd /opt/bitnami/apache2/htdocs
$ npm start
```

バックグラウンドで実行する場合は、PM2を使用します：

```bash
$ sudo npm install -g pm2
$ pm2 start backend/server.js --name="fortune-app"
$ pm2 startup systemd
$ sudo env PATH=$PATH:/opt/bitnami/node/bin pm2 startup systemd -u bitnami --hp /home/bitnami
$ pm2 save
```

### 6. ポート設定

1. Lightsailコンソールの「ネットワーキング」タブを開く
2. 「ルールの追加」をクリック
3. アプリケーションが使用するポート（8080）を追加

## 利用開始

アプリケーションにアクセスし、生年月日と基本情報を入力するだけで、詳細な算命学占いを受けることができます。
