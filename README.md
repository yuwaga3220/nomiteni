# Nomiteni（テニサー向け大会運営アプリ）

テニスサークルの大会運営を自動化するWebアプリケーションです。

## 技術構成

- Language: TypeScript
- Application: Next.js + Node.js
- DB: Prisma / SQLite
- Liverary: Socket.IO

## ディレクトリ構成

```text
Nomiteni/                        
├─ web/                         
│  ├─ src/                       
│  │  ├─ app/                    # App Router
│  │  │  └─ api/                 # Route Handlers（REST API）
│  │  ├─ components/             # UIコンポーネント
│  │  ├─ views/                  # ページ単位の表示
│  │  ├─ providers/              # 状態供給
│  │  └─ lib/                    # クライアント/サーバー共通ユーティリティ
│  │     ├─ client/              
│  │     └─ server/             
│  ├─ prisma/                   
│  ├─ server.ts                  # Next.js + Socket.IO を同一ポートで起動するカスタムサーバー
│  └─ package.json               
└─ package.json                  
```

## 背景・課題
- テニス大会運営において、試合状況を複数の運営者の間で共有することが難しい。
- 大会会場のコートにいなくても試合状況・結果が分からない。

## 機能
- スマホで簡単に大会進行することができる。（大会作成・選手登録・試合結果の登録）
- 観戦者向け、試合状況のリアルタイム公開
  
### 技術的課題と解決策
- トーナメントアルゴリズムの煩雑さに対して、トーナメントブラケットライブラリの活用
- 観戦者にリアルタイムな試合状況や結果を知らせるための、トーナメント情報のリアルタイム更新（Socket.IO）

## 起動・ビルド

```bash
npm install --prefix web
cd web && npx prisma migrate deploy
npm run dev --prefix web
```
