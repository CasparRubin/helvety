# Quality Modernization Baseline

## Baseline Status

- `bun run lint`: passing at workspace scope
- `bun run type-check`: passing at workspace scope
- `bun run test`: passing at workspace scope

## Shared Contracts To Preserve

- `@helvety/config`
  - `createHelvetyNextConfig`
  - `createSecurityHeaders`
  - shared ESLint/TS policy entrypoints
- `@helvety/shared`
  - `createAppProxy` and `createProfiledSecurityProxy`
  - auth redirect/callback behavior
  - server env validation and Supabase client factories
- `@helvety/ui`
  - auth/encryption gate flow (`EncryptionGate`, `AuthTokenHandler`, `SessionRecovery`)
  - shared navigation/session UX behavior

## Phase Success Criteria

1. **Config/shared foundation**
   - Shared config and proxy/env contracts become the single source of truth.
2. **App router/fetch**
   - Remove avoidable dynamic signals and keep route semantics stable.
3. **Hook correctness**
   - URL state and timer lifecycle behavior stay in sync and leak-free.
4. **Domain hardening**
   - Reduce unsafe assertions in auth/store/shared sensitive paths.
5. **E2EE convergence**
   - Keep tasks/notes/contacts behavior aligned through shared patterns.
6. **Verification/guardrails**
   - Lint/type-check/tests stay green and drift checks catch regressions.
