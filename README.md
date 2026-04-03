# Nomiteni

テニスのシングルス大会を運営するための Web アプリです。

## 技術構成

- 言語: TypeScript
- フロントエンド: React + Vite
- バックエンド: Node.js + Express + Socket.IO
- DB: Prisma + SQLite

## 実装済み機能

- 大会エントリー（メールアドレスでログイン、名前・飲み会参加有無・備考入力）
- 管理者ログイン（パスコード方式）
- 当日チェックイン（参加者自身 / 管理者代理）
- トーナメント作成（管理者のみ、当日参加可のチェックイン済み参加者から自動生成）
- 試合運営（コート数設定、試合カードのコート割り当て、開始、結果登録）
- 勝者自動反映と次試合カードの自動生成
- 参加者向けリアルタイム状況表示（進行中試合、トーナメント表）

## 起動方法

1. 依存関係をインストール

```bash
npm run setup
```

1. DB マイグレーション（初回）

```bash
npm run prisma:migrate --prefix server
```

1. 開発サーバー起動

```bash
npm run dev
```

- フロント: `http://localhost:5173`
- API: `http://localhost:4000`

## 管理者ログイン

- バックエンド環境変数 `server/.env` の `ADMIN_PASSCODE` を使用
- 初期値: `admin123`

