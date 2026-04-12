# Nomiteni（テニサー向け大会運営アプリ）

テニスサークルの大会運営を自動化するWebアプリケーションです。

## 技術構成

- 言語: TypeScript
- アプリ: Next.js（App Router）＋カスタム Node サーバー（`server.ts`）で **HTTP・API・Socket.IO を同一ポート**で提供
- API: `src/app/api/**/route.ts`（Route Handlers）
- リアルタイム: Socket.IO（`socket.io` / `socket.io-client`）
- DB: Prisma / SQLite（`better-sqlite3` アダプタ、`web/prisma`）

## ディレクトリ構成（概要）

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

## 起動・ビルド

```bash
npm install --prefix web
cd web && npx prisma migrate deploy
npm run dev --prefix web
```

ブラウザは **http://127.0.0.1:3000**（`0.0.0.0` は開けません）。`Nomiteni ready` がターミナルに出ているか確認してください。ポート競合時は古い `node` を止めるか `PORT=3001` を設定。

作業フォルダは **`web/`** です（ルートから `npm run dev` でも同じく起動します）。移行の名残で空の `client/` が残る場合は、エディタと dev サーバーを止めてからフォルダごと削除してください。

## 背景・課題
- テニスサークルでの大会運営を任される中、エントリー・当日の参加登録・試合状況の把握など、紙やホワイトボードなどを使用し、デジタル化が進んでいない。
- 大会現場に行かないと試合状況・結果が分からない。

## メイン機能
- 大会の開催・エントリー募集
- トーナメント自動作成
- 当日の参加登録
- 試合状況のリアルタイム表示（観戦）
- 結果の集計・出力
  
## 結果と今後の展望

## 技術的課題と解決策
認証・認可処理

## 工夫・こだわり
テニスサークルの大会や宴会への参加率を上げるためのポイント機能などのエンタメ性も高い機能も搭載すること。
テニスサークル自体の盛り上げに貢献できるアプリを目指している。


## 実装済み機能メモ

- 大会エントリー（メールアドレスでログイン、名前・飲み会参加有無・備考入力）
- 認証フロー（`/api/auth/login` でアカウントログイン後、`/api/auth/observer` / `/api/auth/admin` で観戦/管理コンテキストへ。参加者はエントリーまたは大会選択で `participant` スコープへ）
- 当日チェックイン（参加者自身 / 管理者代理）
- トーナメント作成（管理者のみ、当日参加可のチェックイン済み参加者から自動生成）
- 試合運営（コート数設定、試合カードのコート割り当て、開始、結果登録）
- 勝者自動反映と次試合カードの自動生成
- 参加者向けリアルタイム状況表示（進行中試合、トーナメント表）
