# CLAUDE.md

## プロジェクト概要

Hono + Prisma (D1) + Vite + React 19 の Cloudflare Workers フルスタックテンプレート。
KV / R2 / D1 / Durable Objects を単一 Worker で使い、ローカルは `vite` 一発で全バインディングがエミュレートされる。

## コマンド

- `bun install` - 依存関係のインストール
- `bun run dev` - 開発サーバー起動 (port 5173、predev で prisma generate + wrangler types + D1 マイグレーション適用)
- `bun run build` - 型チェック + プロダクションビルド
- `bun run deploy` - デプロイ (`CLOUDFLARE_ENV` で staging/production 切替、デフォルト staging)
- `bun run generate` - `prisma generate` + `wrangler types`
- `bun test` - テスト実行

## コーディング規約

- **言語**: TypeScript (strict)。**変更後は必ず** `bunx biome check --write` と `bunx tsc -b --noEmit` を両方通すこと
- **パッケージマネージャー**: Bun (npm/yarn/pnpm は使わない)
- **フォーマット**: スペース 2 / セミコロン省略 (asNeeded) / シングルクォート / トレーリングカンマなし / JS lineWidth 120
- **GritQL プラグイン** (biome-plugins/) による追加規約:
  - `let` 禁止 (const を使う) / `while` 禁止
  - `as` 型アサーション禁止 (`as const` のみ許可)
  - `??` および `|| ''` 等のフォールバック禁止 (根本の型を直す)
  - 素の `z.string()` 禁止 (`.nonempty()` 等を付ける)
  - `new Date()` 禁止 (dayjs を使う)
  - `parse` より `safeParse` を推奨
- **パスエイリアス**: `@/*` → `./src/*`
- コミットメッセージは Conventional Commits (commitlint が CI で検証)

## アーキテクチャ

- `src/server/index.ts` - Worker エントリ (OpenAPIHono)。**Durable Object クラスはここから re-export する** (wrangler が検出するため)
- `src/server/routes/` - 機能ごとの OpenAPIHono サブアプリ (`createRoute` + zod スキーマで OpenAPI 定義)
- `src/server/durable-objects/` - DO クラス (`extends DurableObject<Env>`、SQLite storage、WebSocket Hibernation)
- `src/app/` - React SPA (TanStack Router file-based routing、`src/app/routes/` にページ追加)
- `src/app/routeTree.gen.ts` - 自動生成 (直接編集禁止、biome/tsc 除外)
- `src/generated/prisma/` - `prisma generate` 出力 (gitignore 済、直接編集禁止)
- `wrangler.toml` - バインディング定義の単一ソース。**変更したら `bunx wrangler types` を再実行すること**
- `worker-configuration.d.ts` - `wrangler types` 生成 (gitignore 済)。`Env` 型はここから供給される

## Prisma + D1 の重要な注意事項

- **`prisma migrate dev` は使わない**。マイグレーションは `prisma/migrations/` のフラットな連番 SQL (`0001_init.sql` 形式) で管理する
- 新規マイグレーション: `bun run migrate:new > prisma/migrations/000X_name.sql` → `bun run migrate:apply` → `bun run generate`
- **`wrangler d1 execute --local --file` での手動適用は禁止**。miniflare と別の SQLite を見る場合があるため、必ず `wrangler d1 migrations apply DB --local` を使う
- PrismaClient はリクエストごとに `new PrismaClient({ adapter: new PrismaD1(c.env.DB) })` で生成し、`c.executionCtx.waitUntil(prisma.$disconnect())` で破棄する
- schema.prisma の generator は `provider = "prisma-client"` + `runtime = "cloudflare"` (旧 `prisma-client-js` に戻さない)

## Durable Objects の注意事項

- SQLite-backed (`new_sqlite_classes`) を使う。新しい DO クラス追加時は wrangler.toml の 3 箇所 (top-level / env.staging / env.production) に binding と migration を追記する
- WebSocket は Hibernation API (`this.ctx.acceptWebSocket(server)` + `webSocketMessage/Close/Error` ハンドラ)。`server.accept()` は使わない
- 呼び出しは `c.env.COUNTER.getByName('name')` でスタブ取得 → RPC メソッド直呼び
