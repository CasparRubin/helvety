# Helvety Architecture Index

This index is the quickest way to locate runtime entry points and ownership boundaries across all apps.

## Apps

- `apps/web`
  - App entry: `apps/web/app/page.tsx`
  - Layout and metadata: `apps/web/app/layout.tsx`
  - Multi-zone rewrites: `apps/web/next.config.ts`
  - Gateway proxy: `apps/web/proxy.ts`
- `apps/auth`
  - Login UI and orchestration: `apps/auth/app/login/page.tsx`
  - Auth actions: `apps/auth/app/actions/*`
  - Zone proxy: `apps/auth/proxy.ts`
- `apps/store`
  - Public catalog and product pages: `apps/store/app/products/*`
  - Account and download actions: `apps/store/app/actions/*`
  - Zone proxy: `apps/store/proxy.ts`
- `apps/pdf`
  - PDF workspace page: `apps/pdf/app/page.tsx`
  - PDF pipeline hooks/libs: `apps/pdf/hooks/*`, `apps/pdf/lib/*`
  - Zone proxy: `apps/pdf/proxy.ts`
- `apps/image-upscaler`
  - Upscaler workspace page: `apps/image-upscaler/app/page.tsx`
  - Client upscaling pipeline: `apps/image-upscaler/lib/*`, `apps/image-upscaler/workers/*`
  - Zone proxy: `apps/image-upscaler/proxy.ts`
- `apps/tasks`
  - Protected page entry: `apps/tasks/app/page.tsx`
  - Task and link actions: `apps/tasks/app/actions/*`
  - Zone proxy: `apps/tasks/proxy.ts`
- `apps/contacts`
  - Protected page entry: `apps/contacts/app/page.tsx`
  - Contact and link actions: `apps/contacts/app/actions/*`
  - Zone proxy: `apps/contacts/proxy.ts`
- `apps/notes`
  - Protected page entry: `apps/notes/app/page.tsx`
  - Note and link actions: `apps/notes/app/actions/*`
  - Zone proxy: `apps/notes/proxy.ts`

## Shared Packages

- `packages/shared`
  - Security/runtime primitives: `src/action-helpers.ts`, `src/rate-limit.ts`, `src/csrf.ts`
  - Auth/session guards and redirects: `src/auth-guard.ts`, `src/auth-redirect.ts`, `src/redirect-validation.ts`
  - Server action helpers: `src/server-action-primitives.ts`, `src/entity-action-primitives.ts`, `src/entity-link-action-primitives.ts`
  - Supabase clients: `src/supabase/client.ts`, `src/supabase/server.ts`, `src/supabase/admin.ts`
- `packages/ui`
  - Shared app shell and auth glue: `src/e2ee-app-root-layout.tsx`, `src/e2ee-app-navbar.tsx`, `src/encryption-gate-app.tsx`
  - Shared primitives/components: `src/*.tsx`
- `packages/config`
  - Shared lint/test/tooling config: `eslint.mjs`, `vitest.mjs`, `postcss.mjs`
  - Shared Next config/header builders: `next.mjs`, `next-headers.mjs`
- `packages/brand`
  - Brand assets and URLs: `src/logo.tsx`, `src/identifier.tsx`, `src/urls.ts`
