-- 1. Create banned words table
CREATE TABLE IF NOT EXISTS public.banned_words (
    id SERIAL PRIMARY KEY,
    word TEXT UNIQUE NOT NULL
);

-- Insert dictionary of bad words (PT/EN)
INSERT INTO public.banned_words (word) VALUES
('puta'), ('caralho'), ('foda'), ('buceta'), ('merda'), ('porra'),
('fdp'), ('vsf'), ('krl'), ('arrombado'), ('corno'), ('piranha'),
('macaco'), ('viado'), ('bicha'), ('sapatão'), ('crioulo'),
('suicidio'), ('estupro'), ('nigger'), ('nigga'),
('fuck'), ('shit'), ('bitch'), ('whore'), ('slut'), ('cunt')
ON CONFLICT DO NOTHING;

ALTER TABLE public.banned_words ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can read banned words" ON public.banned_words FOR SELECT USING (true);

-- 2. Create the censoring function
CREATE OR REPLACE FUNCTION public.censor_text(input_text text)
RETURNS text AS $$
DECLARE
    rec record;
    output_text text;
BEGIN
    IF input_text IS NULL THEN
        RETURN NULL;
    END IF;
    
    output_text := input_text;
    FOR rec IN SELECT word FROM public.banned_words LOOP
        -- \m and \M represent word boundaries in Postgres
        output_text := regexp_replace(output_text, '\m' || rec.word || '\M', '***', 'gi');
    END LOOP;
    
    RETURN output_text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create the moderation trigger function (Censor + Spam Check)
CREATE OR REPLACE FUNCTION public.apply_moderation()
RETURNS trigger AS $$
DECLARE
    last_msg text;
    last_time timestamptz;
BEGIN
    IF TG_TABLE_NAME = 'messages' THEN
        IF NEW.content IS NOT NULL THEN
            NEW.content := public.censor_text(NEW.content);
        END IF;

        -- Check spam (same message in less than 10 seconds)
        IF TG_OP = 'INSERT' THEN
            SELECT content, created_at INTO last_msg, last_time 
            FROM public.messages 
            WHERE user_id = NEW.user_id 
            ORDER BY created_at DESC LIMIT 1;
            
            IF last_msg = NEW.content AND extract(epoch from (now() - last_time)) < 10 THEN
                RAISE EXCEPTION 'Spam detectado: Aguarde antes de enviar mensagens repetidas.';
            END IF;
        END IF;
        
    ELSIF TG_TABLE_NAME = 'posts' THEN
        IF NEW.content IS NOT NULL THEN NEW.content := public.censor_text(NEW.content); END IF;
    ELSIF TG_TABLE_NAME = 'insta_posts' THEN
        IF NEW.content IS NOT NULL THEN NEW.content := public.censor_text(NEW.content); END IF;
    ELSIF TG_TABLE_NAME = 'post_comments' THEN
        IF NEW.content IS NOT NULL THEN NEW.content := public.censor_text(NEW.content); END IF;
    ELSIF TG_TABLE_NAME = 'insta_comments' THEN
        IF NEW.content IS NOT NULL THEN NEW.content := public.censor_text(NEW.content); END IF;
    ELSIF TG_TABLE_NAME = 'dm_messages' THEN
        IF NEW.content IS NOT NULL THEN NEW.content := public.censor_text(NEW.content); END IF;
    ELSIF TG_TABLE_NAME = 'characters' THEN
        IF NEW.full_name IS NOT NULL THEN NEW.full_name := public.censor_text(NEW.full_name); END IF;
        IF NEW.background IS NOT NULL THEN NEW.background := public.censor_text(NEW.background); END IF;
        IF NEW.personality IS NOT NULL THEN NEW.personality := public.censor_text(NEW.personality); END IF;
        IF NEW.history IS NOT NULL THEN NEW.history := public.censor_text(NEW.history); END IF;
        IF NEW.strength IS NOT NULL THEN NEW.strength := public.censor_text(NEW.strength); END IF;
        IF NEW.weakness IS NOT NULL THEN NEW.weakness := public.censor_text(NEW.weakness); END IF;
        IF NEW.fears IS NOT NULL THEN NEW.fears := public.censor_text(NEW.fears); END IF;
        IF NEW.dreams IS NOT NULL THEN NEW.dreams := public.censor_text(NEW.dreams); END IF;
        IF NEW.quotes IS NOT NULL THEN NEW.quotes := public.censor_text(NEW.quotes); END IF;
        IF NEW.physical_description IS NOT NULL THEN NEW.physical_description := public.censor_text(NEW.physical_description); END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Apply triggers
DROP TRIGGER IF EXISTS tr_messages_moderation ON public.messages;
CREATE TRIGGER tr_messages_moderation
    BEFORE INSERT OR UPDATE ON public.messages
    FOR EACH ROW EXECUTE FUNCTION public.apply_moderation();

DROP TRIGGER IF EXISTS tr_posts_moderation ON public.posts;
CREATE TRIGGER tr_posts_moderation
    BEFORE INSERT OR UPDATE ON public.posts
    FOR EACH ROW EXECUTE FUNCTION public.apply_moderation();

DROP TRIGGER IF EXISTS tr_insta_posts_moderation ON public.insta_posts;
CREATE TRIGGER tr_insta_posts_moderation
    BEFORE INSERT OR UPDATE ON public.insta_posts
    FOR EACH ROW EXECUTE FUNCTION public.apply_moderation();

DROP TRIGGER IF EXISTS tr_post_comments_moderation ON public.post_comments;
CREATE TRIGGER tr_post_comments_moderation
    BEFORE INSERT OR UPDATE ON public.post_comments
    FOR EACH ROW EXECUTE FUNCTION public.apply_moderation();

DROP TRIGGER IF EXISTS tr_insta_comments_moderation ON public.insta_comments;
CREATE TRIGGER tr_insta_comments_moderation
    BEFORE INSERT OR UPDATE ON public.insta_comments
    FOR EACH ROW EXECUTE FUNCTION public.apply_moderation();

DROP TRIGGER IF EXISTS tr_dm_messages_moderation ON public.dm_messages;
CREATE TRIGGER tr_dm_messages_moderation
    BEFORE INSERT OR UPDATE ON public.dm_messages
    FOR EACH ROW EXECUTE FUNCTION public.apply_moderation();

DROP TRIGGER IF EXISTS tr_characters_moderation ON public.characters;
CREATE TRIGGER tr_characters_moderation
    BEFORE INSERT OR UPDATE ON public.characters
    FOR EACH ROW EXECUTE FUNCTION public.apply_moderation();

-- 5. Add has_read_marauders_guide to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS has_read_marauders_guide BOOLEAN DEFAULT FALSE;
