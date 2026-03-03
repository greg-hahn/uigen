# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# First-time setup (installs deps, generates Prisma client, runs migrations)
npm run setup

# Development server (with Turbopack)
npm run dev

# Build for production
npm run build

# Lint
npm lint

# Run all tests
npm test

# Run a single test file
npx vitest run src/components/chat/__tests__/ChatInterface.test.tsx

# Reset database (destructive)
npm run db:reset

# Regenerate Prisma client after schema changes
npx prisma generate

# Create a new migration after schema changes
npx prisma migrate dev
```

All npm scripts prepend `NODE_OPTIONS='--require ./node-compat.cjs'` — this compatibility shim is required for the app to run.

## Architecture

UIGen is a Next.js 15 (App Router) app where users describe React components in a chat and see them rendered live. Components exist only in a virtual in-memory file system; nothing is written to disk.

### Data flow

1. User sends a message → `ChatContext` (wraps Vercel AI SDK `useChat`) POSTs to `/api/chat`
2. The chat route reconstructs a `VirtualFileSystem` from the serialized files in the request body, then streams responses from Claude with two tools: `str_replace_editor` and `file_manager`
3. Tool calls stream back to the client; `FileSystemContext.handleToolCall` applies them to the client-side `VirtualFileSystem` instance
4. `PreviewFrame` watches `refreshTrigger` from `FileSystemContext`, runs Babel on all JSX/TSX files, builds an import map with blob URLs, and sets `iframe.srcdoc` to the generated HTML
5. If a project ID exists and the user is authenticated, the route saves the full message history and serialized file system to the database on completion

### Key modules

- [src/lib/file-system.ts](src/lib/file-system.ts) — `VirtualFileSystem` class; the core in-memory FS with `serialize`/`deserializeFromNodes` for round-tripping through the API and database
- [src/lib/transform/jsx-transformer.ts](src/lib/transform/jsx-transformer.ts) — Babel-based JSX/TSX transform, import map construction (blob URLs for local files, `esm.sh` for third-party packages), and `createPreviewHTML` which generates the full iframe document
- [src/lib/contexts/file-system-context.tsx](src/lib/contexts/file-system-context.tsx) — React context that owns the client-side `VirtualFileSystem` and exposes `handleToolCall` to apply AI tool calls in real time
- [src/lib/contexts/chat-context.tsx](src/lib/contexts/chat-context.tsx) — React context wrapping Vercel AI SDK's `useChat`; serializes the file system on every request body
- [src/lib/tools/](src/lib/tools/) — Vercel AI SDK tool definitions (`str_replace_editor`, `file_manager`) that delegate to the server-side `VirtualFileSystem`
- [src/lib/provider.ts](src/lib/provider.ts) — Returns the real Anthropic model (`claude-haiku-4-5`) when `ANTHROPIC_API_KEY` is set, or a `MockLanguageModel` otherwise
- [src/lib/auth.ts](src/lib/auth.ts) — JWT sessions using `jose`, stored in an `httpOnly` cookie named `auth-token`
- [src/middleware.ts](src/middleware.ts) — Protects `/api/projects` and `/api/filesystem` routes

### Database

Prisma with SQLite (`prisma/dev.db`). The generated client outputs to `src/generated/prisma` (non-standard location set in `schema.prisma`). Two models: `User` (email + bcrypt password) and `Project` (stores `messages` and `data` as JSON strings, `userId` is optional to support anonymous sessions).

### Preview rendering

The preview iframe uses native ES module import maps. Local files are transformed by Babel and served as `blob:` URLs; third-party packages are loaded from `esm.sh`. Tailwind CSS is loaded from CDN (`cdn.tailwindcss.com`) inside the iframe. The entry point lookup order is `/App.jsx` → `/App.tsx` → `/index.jsx` → `/index.tsx` → `/src/App.jsx` → `/src/App.tsx` → first `.jsx`/`.tsx` found.

### Testing

Vitest with `jsdom` environment and `@testing-library/react`. Test files live in `__tests__/` directories adjacent to the code they test.

### Environment variables

| Variable | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | Required for real AI generation; falls back to mock provider if absent |
| `JWT_SECRET` | Signs session tokens; defaults to `development-secret-key` |
