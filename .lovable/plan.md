
# Auditoria Técnica Profunda — Portal Hogwarts

Após varredura completa (rotas, hooks, estados, Supabase, RLS, linter, console logs e replay), identifiquei os pontos abaixo. O plano corrige tudo sem alterar funcionalidades nem design.

---

## 1. Autenticação & Sessão (src/lib/auth.ts)

**Problemas:**
- `_lastPingAt` armazenado via `set({} as any)` polui o store e não é tipado — pode causar re-renderizações desnecessárias em todos os consumidores de `useAuth`.
- `init()` não retorna unsubscribe do `onAuthStateChange` — leak ao recarregar HMR.
- `isLoading` pode ficar `true` para sempre se `fetchProfile` rodar antes da sessão (edge case quando perfil ainda não existe). Já há `finally`, mas falta garantir após `SIGNED_IN` sem perfil.
- `pingPresence` faz UPDATE no DB a cada 45s mesmo em abas em background — desperdiça writes.

**Correções:**
- Mover `_lastPingAt` para variável de módulo (fora do Zustand).
- Guardar a subscription do auth e limpar no HMR.
- Pular `pingPresence` quando `document.hidden`.
- Garantir `isLoading=false` em todos os caminhos de `init`.

## 2. Realtime (src/hooks/core/useRealtime.ts)

**Problemas:**
- `channelId` usa `Math.random()` dentro do `useEffect` → a cada re-render com novo filter cria novo canal sem garantia de cleanup determinístico.
- Não há tratamento de erro/desconexão (`CHANNEL_ERROR`, `TIMED_OUT`).

**Correções:**
- Estabilizar `channelId` (sem random) com base nos parâmetros.
- Logar status de erro e tentar reconnect via `supabase.removeChannel` + remount.

## 3. React Query / App.tsx

**Problemas:**
- `QueryClient` recriado via `useMemo` no root está OK, mas `retry: 1` + `refetchOnWindowFocus: false` mascaram falhas de rede silenciosas em hooks que dependem de refetch.
- Faltam `errorBoundary` por rota Suspense — uma lazy import quebrada derruba todo o dashboard.

**Correções:**
- Envolver `<Suspense>` interno do dashboard com `ErrorBoundary` próprio com fallback de "Recarregar".
- Adicionar `onError` global no QueryClient para toast discreto.

## 4. Rotas & Proteção

**Problemas:**
- `/dashboard/admin` está aninhado dentro de `<ProtectedRoute>` e novamente `<ProtectedRoute adminOnly>` — duplo wrap funciona, mas se `isLoading` ficar travado, mostra loading infinito.
- Rota `*` redireciona para `/` mesmo quando o usuário está logado — deveria mandar para `/dashboard`.

**Correções:**
- 404 condicional ao `isAuthenticated`.
- Garantir `<ProtectedRoute>` libera assim que `isLoading=false` e renderiza fallback claro em erro.

## 5. Console Errors observados

- `Audio play prevented — NotSupportedError` em `AmbientAudio.tsx`: o `<audio>` aponta para fonte inexistente/sem suporte. Adicionar try/catch + fallback silencioso e checar `canPlayType` antes de `play()`.

## 6. Performance

**Problemas:**
- Vários pages > 700 linhas (`Admin.tsx` 1129, `Profile.tsx` 1004, `GringottsStore.tsx` 726, `ChatRoom.tsx` 719) com queries N+1 disfarçadas dentro de `.map`.
- `Feed.tsx` e `InstaHogwarts.tsx` re-renderizam toda a lista quando uma reação muda (state global em vez de por-item).

**Correções:**
- Memoizar items com `React.memo` + chave estável.
- Trocar reações para mutation otimista via React Query `setQueryData`.
- Adicionar `Suspense` interno em seções pesadas do Admin (Tabs lazy).

## 7. Responsividade (viewport atual 787px)

**Problemas:**
- `DashboardLayout` sidebar fixa pode sobrepor conteúdo no breakpoint md.
- Tabelas em `Admin` e `AdminFinance` quebram em mobile.
- Modais com `max-w` grandes saem da viewport em telas < 400px.

**Correções:**
- Envolver tabelas com `overflow-x-auto`.
- Trocar `max-w-2xl` por `max-w-[min(42rem,calc(100vw-2rem))]` em modais críticos.
- Sidebar com `Sheet` em telas < md (já existe pattern, aplicar consistente).

## 8. Banco de Dados — Linter Supabase (57 warnings)

**Críticos a corrigir via migration (sem mudar comportamento):**
- 8× `Function Search Path Mutable` → adicionar `SET search_path = public` nas funções customizadas (`award_xp_action`, `has_role`, `update_updated_at_column`, etc.).
- `Extension in Public` → mover extensões para schema `extensions`.
- `RLS Policy Always True` em INSERT de `notifications` → restringir a `auth.uid() IS NOT NULL` e/ou regra de autor.
- `Public bucket allows listing` → restringir SELECT do bucket a paths do próprio usuário.
- `Public can execute SECURITY DEFINER function` → REVOKE EXECUTE FROM anon nas funções não destinadas a público.

## 9. Edge Function `infinitepay-webhook`

**Problemas:**
- Sem verificação de assinatura/HMAC → qualquer um pode creditar Galeões/VIP chamando o endpoint.
- Race condition: duas chamadas simultâneas para o mesmo `order_nsu` podem creditar duas vezes (check `status='paid'` não é atômico).

**Correções:**
- Validar header `X-Signature` (se InfinitePay enviar) ou um shared secret via env `INFINITEPAY_WEBHOOK_SECRET`.
- Tornar update de status atômico: `UPDATE ... WHERE id = $1 AND status <> 'paid' RETURNING *` e só creditar se affected=1.

## 10. Tipagem / `any`

- `auth.ts` usa `as any` em vários updates de profile. Embora os tipos gerados do Supabase já cubram, fazer cast para `Database['public']['Tables']['profiles']['Update']` evita silenciar bugs de schema drift.

## 11. Memory leaks / listeners

- `MagicalParticles`, `AmbientAudio`, `MaraudersMap` criam intervals/RAF sem cleanup completo em alguns paths.
- `Notifications` subscreve realtime sem unsubscribe quando o user faz logout (apenas no unmount).

**Correção:** retornar cleanup explícito em todos os `useEffect` com timers/listeners.

## 12. Tratamento de erros UX

- Vários `await supabase...` ignoram `error` (apenas `console.error`). Centralizar via helper `handleSupabaseError(error, toastTitle)` que dispara toast e loga.

---

## Detalhes Técnicos

```text
Camadas tocadas:
  ├─ src/lib/auth.ts             (sessão, presence, types)
  ├─ src/hooks/core/useRealtime  (canal estável + erro)
  ├─ src/App.tsx                 (ErrorBoundary por route, 404 condicional)
  ├─ src/components/AmbientAudio (canPlayType)
  ├─ src/components/Protected*   (loading robusto)
  ├─ src/pages/Admin*/Profile/Feed/Insta/ChatRoom (memo, overflow, queries)
  ├─ supabase/migrations/<new>   (search_path, RLS, REVOKE, atomic order update)
  └─ supabase/functions/infinitepay-webhook (HMAC + atomic credit)

Sem mudanças de design system, sem remoção de funcionalidades.
Verificação final: lint, vitest, navegação manual em /dashboard, /admin, /feed, /duels, /store, /profile em viewport 375px e 1440px.
```

## Fases de Execução

1. **Hotfixes runtime** — auth store, useRealtime, AmbientAudio, ErrorBoundary, 404.
2. **Performance & memo** — Feed, Insta, ChatRoom, Profile, Admin tabs lazy.
3. **Responsividade** — sidebar, tabelas, modais.
4. **Migration de segurança DB** — search_path, RLS, REVOKE, extensions, bucket.
5. **Webhook hardening** — HMAC + UPDATE atômico.
6. **Helper de erros + remoção de `any`**.
7. **Varredura final** — linter, console, manual smoke test mobile/desktop.
