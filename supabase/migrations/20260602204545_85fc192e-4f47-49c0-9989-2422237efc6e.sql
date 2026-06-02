-- ====== 12.A RP TEAMS ======
CREATE TABLE IF NOT EXISTS public.rp_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  leader_id UUID NOT NULL,
  house TEXT NULL,
  emblem TEXT NOT NULL DEFAULT '⚔️',
  motto TEXT,
  description TEXT,
  level INT NOT NULL DEFAULT 1,
  xp INT NOT NULL DEFAULT 0,
  treasury INT NOT NULL DEFAULT 0,
  member_count INT NOT NULL DEFAULT 1,
  max_members INT NOT NULL DEFAULT 12,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.rp_teams TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rp_teams TO authenticated;
GRANT ALL ON public.rp_teams TO service_role;
ALTER TABLE public.rp_teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view teams" ON public.rp_teams FOR SELECT USING (true);
CREATE POLICY "Authenticated can create teams" ON public.rp_teams FOR INSERT TO authenticated WITH CHECK (auth.uid() = leader_id);
CREATE POLICY "Leader can update team" ON public.rp_teams FOR UPDATE TO authenticated USING (auth.uid() = leader_id);
CREATE POLICY "Leader can delete team" ON public.rp_teams FOR DELETE TO authenticated USING (auth.uid() = leader_id);

CREATE TABLE IF NOT EXISTS public.rp_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.rp_teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);
GRANT SELECT ON public.rp_team_members TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rp_team_members TO authenticated;
GRANT ALL ON public.rp_team_members TO service_role;
ALTER TABLE public.rp_team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view members" ON public.rp_team_members FOR SELECT USING (true);
CREATE POLICY "User can join team" ON public.rp_team_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User can leave team" ON public.rp_team_members FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.rp_team_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.rp_teams(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  reward_xp INT NOT NULL DEFAULT 100,
  reward_gold INT NOT NULL DEFAULT 50,
  status TEXT NOT NULL DEFAULT 'open',
  deadline TIMESTAMPTZ,
  completed_by UUID,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rp_team_missions TO authenticated;
GRANT ALL ON public.rp_team_missions TO service_role;
ALTER TABLE public.rp_team_missions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view missions" ON public.rp_team_missions FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.rp_team_members m WHERE m.team_id = rp_team_missions.team_id AND m.user_id = auth.uid()));
CREATE POLICY "Members can create/update missions" ON public.rp_team_missions FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.rp_team_members m WHERE m.team_id = rp_team_missions.team_id AND m.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.rp_team_members m WHERE m.team_id = rp_team_missions.team_id AND m.user_id = auth.uid()));

-- Trigger to keep member_count synced + auto-add leader as member
CREATE OR REPLACE FUNCTION public.rp_team_after_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.rp_team_members(team_id, user_id, role) VALUES (NEW.id, NEW.leader_id, 'leader')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
DROP TRIGGER IF EXISTS trg_rp_team_after_insert ON public.rp_teams;
CREATE TRIGGER trg_rp_team_after_insert AFTER INSERT ON public.rp_teams
FOR EACH ROW EXECUTE FUNCTION public.rp_team_after_insert();

CREATE OR REPLACE FUNCTION public.rp_team_member_count_sync()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.rp_teams SET member_count = member_count + 1 WHERE id = NEW.team_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.rp_teams SET member_count = GREATEST(0, member_count - 1) WHERE id = OLD.team_id;
  END IF;
  RETURN NULL;
END $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
DROP TRIGGER IF EXISTS trg_rp_team_member_count ON public.rp_team_members;
CREATE TRIGGER trg_rp_team_member_count AFTER INSERT OR DELETE ON public.rp_team_members
FOR EACH ROW EXECUTE FUNCTION public.rp_team_member_count_sync();

-- ====== 12.B LIVE EVENTS ======
CREATE TABLE IF NOT EXISTS public.live_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'baile',
  cover_emoji TEXT NOT NULL DEFAULT '🎭',
  location TEXT NOT NULL DEFAULT 'Salão Principal',
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  max_attendees INT,
  reward_xp INT NOT NULL DEFAULT 50,
  reward_gold INT NOT NULL DEFAULT 25,
  status TEXT NOT NULL DEFAULT 'agendado',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.live_events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.live_events TO authenticated;
GRANT ALL ON public.live_events TO service_role;
ALTER TABLE public.live_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view events" ON public.live_events FOR SELECT USING (true);
CREATE POLICY "Admins create events" ON public.live_events FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update events" ON public.live_events FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete events" ON public.live_events FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.event_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.live_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rsvp TEXT NOT NULL DEFAULT 'going',
  attended BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_attendees TO authenticated;
GRANT ALL ON public.event_attendees TO service_role;
ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone logged can view attendees" ON public.event_attendees FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can RSVP" ON public.event_attendees FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own RSVP" ON public.event_attendees FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users cancel own RSVP" ON public.event_attendees FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.event_chat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.live_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.event_chat TO authenticated;
GRANT ALL ON public.event_chat TO service_role;
ALTER TABLE public.event_chat ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Attendees view event chat" ON public.event_chat FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.event_attendees a WHERE a.event_id = event_chat.event_id AND a.user_id = auth.uid()));
CREATE POLICY "Attendees can chat" ON public.event_chat FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.event_attendees a WHERE a.event_id = event_chat.event_id AND a.user_id = auth.uid()));

ALTER PUBLICATION supabase_realtime ADD TABLE public.event_chat;
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_attendees;

-- ====== 12.C REPUTATION ======
CREATE TABLE IF NOT EXISTS public.reputation (
  user_id UUID PRIMARY KEY,
  score INT NOT NULL DEFAULT 0,
  respect INT NOT NULL DEFAULT 0,
  admiration INT NOT NULL DEFAULT 0,
  fear INT NOT NULL DEFAULT 0,
  title TEXT NOT NULL DEFAULT 'Iniciante',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.reputation TO anon;
GRANT SELECT, INSERT, UPDATE ON public.reputation TO authenticated;
GRANT ALL ON public.reputation TO service_role;
ALTER TABLE public.reputation ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view reputation" ON public.reputation FOR SELECT USING (true);
CREATE POLICY "System updates reputation" ON public.reputation FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User updates own rep row" ON public.reputation FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.endorsements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user UUID NOT NULL,
  to_user UUID NOT NULL,
  type TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(from_user, to_user, type),
  CHECK (from_user <> to_user),
  CHECK (type IN ('respect','admiration','fear'))
);
GRANT SELECT, INSERT, DELETE ON public.endorsements TO authenticated;
GRANT ALL ON public.endorsements TO service_role;
ALTER TABLE public.endorsements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone logged can view endorsements" ON public.endorsements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can endorse" ON public.endorsements FOR INSERT TO authenticated WITH CHECK (auth.uid() = from_user);
CREATE POLICY "Users can remove own endorsement" ON public.endorsements FOR DELETE TO authenticated USING (auth.uid() = from_user);

CREATE TABLE IF NOT EXISTS public.social_bonds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a UUID NOT NULL,
  user_b UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'friend',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_a, user_b, type),
  CHECK (user_a <> user_b),
  CHECK (type IN ('friend','rival','mentor'))
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_bonds TO authenticated;
GRANT ALL ON public.social_bonds TO service_role;
ALTER TABLE public.social_bonds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own bonds" ON public.social_bonds FOR SELECT TO authenticated USING (auth.uid() IN (user_a, user_b));
CREATE POLICY "Users create bonds" ON public.social_bonds FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_a);
CREATE POLICY "Users update bonds they receive/sent" ON public.social_bonds FOR UPDATE TO authenticated USING (auth.uid() IN (user_a, user_b));
CREATE POLICY "Users delete own bonds" ON public.social_bonds FOR DELETE TO authenticated USING (auth.uid() IN (user_a, user_b));

-- Auto-sync reputation score from endorsements
CREATE OR REPLACE FUNCTION public.sync_reputation_on_endorsement()
RETURNS TRIGGER AS $$
DECLARE
  target UUID;
  r_count INT; a_count INT; f_count INT;
  total_score INT; new_title TEXT;
BEGIN
  target := COALESCE(NEW.to_user, OLD.to_user);
  SELECT COUNT(*) FILTER (WHERE type='respect'),
         COUNT(*) FILTER (WHERE type='admiration'),
         COUNT(*) FILTER (WHERE type='fear')
    INTO r_count, a_count, f_count
    FROM public.endorsements WHERE to_user = target;
  total_score := r_count * 10 + a_count * 15 + f_count * 12;
  new_title := CASE
    WHEN total_score >= 500 THEN 'Lenda de Hogwarts'
    WHEN total_score >= 250 THEN 'Respeitado'
    WHEN total_score >= 100 THEN 'Conhecido'
    WHEN total_score >= 30 THEN 'Aprendiz'
    ELSE 'Iniciante'
  END;
  INSERT INTO public.reputation(user_id, score, respect, admiration, fear, title, updated_at)
    VALUES (target, total_score, r_count, a_count, f_count, new_title, now())
  ON CONFLICT (user_id) DO UPDATE SET
    score = EXCLUDED.score, respect = EXCLUDED.respect,
    admiration = EXCLUDED.admiration, fear = EXCLUDED.fear,
    title = EXCLUDED.title, updated_at = now();
  RETURN NULL;
END $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
DROP TRIGGER IF EXISTS trg_endorsement_sync ON public.endorsements;
CREATE TRIGGER trg_endorsement_sync AFTER INSERT OR DELETE ON public.endorsements
FOR EACH ROW EXECUTE FUNCTION public.sync_reputation_on_endorsement();