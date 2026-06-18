-- 1. CORRIGIR OS GATILHOS DE NOTIFICAÇÃO (INCLUIR /dashboard/ NAS ROTAS)

-- Criar função de gatilho para notificar DMs recebidas
CREATE OR REPLACE FUNCTION public.trg_notify_dm_message()
RETURNS TRIGGER AS $$
DECLARE
  v_sender_name TEXT;
BEGIN
  -- Não notificar se o usuário enviar mensagem para si mesmo
  IF NEW.sender_id = NEW.receiver_id THEN
    RETURN NEW;
  END IF;

  -- Obter o nome do remetente
  SELECT full_name INTO v_sender_name
  FROM public.profiles
  WHERE user_id = NEW.sender_id;

  IF v_sender_name IS NULL THEN
    v_sender_name := 'Alguém';
  END IF;

  -- Inserir a notificação no Corujal do destinatário (COM A ROTA CORRETA)
  INSERT INTO public.notifications (user_id, title, message, link)
  VALUES (
    NEW.receiver_id,
    '🦉 Correio',
    'Você recebeu uma mensagem de ' || v_sender_name || '!',
    '/dashboard/dm/' || NEW.sender_id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Criar função de gatilho para notificar mudanças de amizade
CREATE OR REPLACE FUNCTION public.trg_notify_friendship_change()
RETURNS TRIGGER AS $$
DECLARE
  v_user_name TEXT;
  v_friend_name TEXT;
BEGIN
  -- Se for um novo pedido de amizade (ou aceitação)
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    
    IF NEW.status = 'pending' THEN
      -- Obter nome de quem enviou o pedido
      SELECT full_name INTO v_user_name
      FROM public.profiles
      WHERE user_id = NEW.user_id;

      IF v_user_name IS NOT NULL THEN
        -- Notificar o recebedor
        INSERT INTO public.notifications (user_id, title, message, link)
        VALUES (
          NEW.friend_id,
          '🤝 Amizade',
          v_user_name || ' te enviou um pedido de amizade.',
          '/dashboard/friends'
        );
      END IF;

    ELSIF NEW.status = 'accepted' THEN
      -- Obter nome de quem aceitou o pedido
      SELECT full_name INTO v_friend_name
      FROM public.profiles
      WHERE user_id = NEW.friend_id;

      IF v_friend_name IS NOT NULL THEN
        -- Notificar o remetente original de que foi aceito
        INSERT INTO public.notifications (user_id, title, message, link)
        VALUES (
          NEW.user_id,
          '✨ Amizade',
          v_friend_name || ' aceitou seu pedido de amizade!',
          '/dashboard/friends'
        );
      END IF;

    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. NOVA TRAVA DE SEGURANÇA: IMPEDIR MENSAGENS SE HOUVER BLOQUEIO
CREATE OR REPLACE FUNCTION public.trg_prevent_blocked_dms()
RETURNS TRIGGER AS $$
DECLARE
  v_blocked BOOLEAN;
BEGIN
  -- Verificar se existe uma relação de bloqueio entre sender e receiver em qualquer direção
  SELECT EXISTS (
    SELECT 1 FROM public.friendships 
    WHERE (
      (user_id = NEW.sender_id AND friend_id = NEW.receiver_id) OR
      (user_id = NEW.receiver_id AND friend_id = NEW.sender_id)
    )
    AND status = 'blocked'
  ) INTO v_blocked;

  IF v_blocked THEN
    RAISE EXCEPTION 'Não é possível enviar mensagens devido a um bloqueio.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atrelar a trava de segurança à tabela dm_messages antes da inserção
DROP TRIGGER IF EXISTS prevent_blocked_dms ON public.dm_messages;
CREATE TRIGGER prevent_blocked_dms
  BEFORE INSERT ON public.dm_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_prevent_blocked_dms();
