# Tasks/Contacts Redirect Trace Matrix

This matrix captures every navigation side-effect discovered in detail flows and the applied risk controls.
The policy is current with the terminal-only hard-logout classifier and route-freshness guard behavior.

## Redirect Sources

| Source                      | File                                          | Trigger                                                   | Risk                                                  | Control                                               |
| --------------------------- | --------------------------------------------- | --------------------------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------- |
| `handleAuthErrorNavigation` | `packages/ui/src/auth-navigation.ts`          | Classified auth intent from async responses               | stale callback redirects after route change           | `expectedRoute` gate + dedupe + request age telemetry |
| `triggerHardLogoutOnce`     | `packages/ui/src/session-recovery.tsx`        | explicit terminal auth state only                         | transient resume turbulence forcing route exit        | classifier gate + ambiguous retry threshold           |
| `redirectToLoginOnce`       | `packages/ui/src/session-recovery.tsx`        | explicit login intent or repeated ambiguous no-user state | first-failure redirect bounce                         | multi-step confirmation before redirect               |
| `triggerHardLogoutOnce`     | `packages/ui/src/encryption-gate.tsx`         | hard terminal auth intent only                            | non-terminal encryption/storage errors forcing logout | context error classification before hard logout       |
| `redirectToLoginOnce`       | `packages/ui/src/encryption-gate.tsx`         | login intent or non-terminal context failures             | redirect from noisy auth events                       | `SIGNED_OUT` event gating and dedupe                  |
| `router.replace`            | `apps/tasks/components/item-editor.tsx`       | explicit user actions (`back`, `delete`)                  | passive async route rollback                          | explicit-intent-only transitions                      |
| `router.replace`            | `apps/contacts/components/contact-editor.tsx` | explicit user actions (`back`, `delete`)                  | passive async route rollback                          | explicit-intent-only transitions                      |
| `handleAuthErrorNavigation` | `apps/tasks/hooks/*`, `apps/contacts/hooks/*` | server action/auth errors in async hooks                  | stale request callback redirects                      | request token checks + route snapshot forwarding      |

## High-Risk Areas Hardened

- Detail-critical async hooks now capture `routeAtStart` + `requestStartedAt`.
- Auth navigation executes only when the originating route is still active.
- Non-explicit/ambiguous auth text no longer escalates to hard logout.
- Legacy route-instance checks were removed from detail editors; only explicit user navigation remains.
