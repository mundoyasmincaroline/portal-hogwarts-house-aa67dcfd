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

  -- Inserir a notificação no Corujal do destinatário
  INSERT INTO public.notifications (user_id, title, message, link)
  VALUES (
    NEW.receiver_id,
    '🦉 Correio',
    'Nova mensagem de ' || v_sender_name,
    '/dms/' || NEW.sender_id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atrelar o gatilho à tabela dm_messages
DROP TRIGGER IF EXISTS notify_dm_message ON public.dm_messages;
CREATE TRIGGER notify_dm_message
  AFTER INSERT ON public.dm_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_notify_dm_message();


-- Criar função de gatilho para notificar mudanças de amizade (Envio/Aceitação)
CREATE OR REPLACE FUNCTION public.trg_notify_friendship_change()
RETURNS TRIGGER AS $$
DECLARE
  v_user_name TEXT;
  v_friend_name TEXT;
BEGIN
  -- Se for um novo pedido de amizade
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    
    IF NEW.status = 'pending' THEN
      -- Obter nome de quem enviou o pedido (user_id)
      SELECT full_name INTO v_user_name
      FROM public.profiles
      WHERE user_id = NEW.user_id;

      IF v_user_name IS NOT NULL THEN
        -- Notificar o recebedor (friend_id)
        INSERT INTO public.notifications (user_id, title, message, link)
        VALUES (
          NEW.friend_id,
          '🤝 Amizade',
          v_user_name || ' te enviou um pedido de amizade.',
          '/friends'
        );
      END IF;

    ELSIF NEW.status = 'accepted' THEN
      -- Obter nome de quem aceitou o pedido (friend_id)
      SELECT full_name INTO v_friend_name
      FROM public.profiles
      WHERE user_id = NEW.friend_id;

      IF v_friend_name IS NOT NULL THEN
        -- Notificar o remetente original (user_id)
        INSERT INTO public.notifications (user_id, title, message, link)
        VALUES (
          NEW.user_id,
          '✨ Amizade',
          v_friend_name || ' aceitou seu pedido de amizade!',
          '/friends'
        );
      END IF;

    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atrelar o gatilho à tabela friendships
DROP TRIGGER IF EXISTS notify_friendship_change ON public.friendships;
CREATE TRIGGER notify_friendship_change
  AFTER INSERT OR UPDATE ON public.friendships
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_notify_friendship_change();
