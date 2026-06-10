# Checklist E2E — Cadastro & Troca de Turno

Objetivo: validar que um novo usuário consegue se cadastrar, criar personagem, navegar pelo portal e trocar entre personagens sem erros.

## 1. Cadastro (Register.tsx → /register)
- [ ] Formulário aceita e-mail válido + senha forte (sem aceitar e-mail duplicado).
- [ ] Após `signUp`, executa `signInWithPassword` automaticamente (auto-confirm enabled).
- [ ] Trigger `handle_new_user` cria linha em `public.profiles` com `approved=false`.
- [ ] Redireciona para `/dashboard` (se aprovado) ou `/pending-approval`.
- [ ] Profile recebe `house` default e XP=0.
- [ ] Notificação de boas-vindas aparece (welcome_bonus reward).

## 2. Criação de personagem (CharacterSelection / CharacterCreation)
- [ ] Usuário sem personagem é forçado ao `CharacterCreation`.
- [ ] Salvar cria linha em `characters` (user_id, full_name, house, character_type).
- [ ] Realtime atualiza tela quando admin cria ficha do outro lado.
- [ ] `profile.active_character_id` recebe o novo id automaticamente.
- [ ] `profile.house` sincroniza com `character.house`.

## 3. Login pós-cadastro
- [ ] `/login` aceita as credenciais recém-criadas.
- [ ] Sessão é persistida (recarregar mantém o usuário).
- [ ] `useAuth` carrega `profile` + `isAdmin` + `active_character_id`.

## 4. Troca de turno (TurnSwitcher)
- [ ] Botão na topbar abre o popover com lista de personagens.
- [ ] Selecionar personagem chama `characterService.setActiveCharacter` (atualiza `profiles.active_character_id` E `profiles.house`).
- [ ] `fetchProfile` é chamado e refresca XP/Casa sem reload.
- [ ] Toast confirma "Turno: {nome}".
- [ ] Tema/brasão da Casa atualizam imediatamente no Dashboard.
- [ ] Em caso de erro, profile reverte ao anterior.

## 5. Criação de segundo personagem
- [ ] "Nova Ficha" no popover redireciona para `/dashboard/profile`.
- [ ] Limite de 2 personagens por conta é respeitado.

## 6. Casos de borda
- [ ] Login com personagem deletado: CharacterSelection abre auto.
- [ ] Profile sem `active_character_id` mas com characters → assume o primeiro.
- [ ] Admin pode pular criação de personagem.
- [ ] Realtime de `profiles` propaga mudanças do admin sem F5.

## 7. Galeões / XP
- [ ] Reward de `welcome_bonus` credita XP/Galeons no profile.
- [ ] `currency_ledger` registra cada operação.
- [ ] Saldo do TurnSwitcher e Wallet bate com profile.galeons.

## 8. Admin (Phase 2)
- [ ] Painel "Poderes do Ministério" abre dialog "Nova Conta" → cria usuário (aprovado).
- [ ] "Redefinir Senha" gera link de recovery e copia para clipboard.
- [ ] Função `admin_recompute_member(uuid)` recalcula galeons + sincroniza casa.