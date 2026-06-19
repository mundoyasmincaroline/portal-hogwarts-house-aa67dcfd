import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, AlertTriangle, ArrowRight, Skull, Swords, Beaker, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import EmojiIcon from "@/components/shared/EmojiIcon";

export default function MaraudersDiaryWidget() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState({
    rp_claim: { done: false, loading: true },
    raid_boss: { active: false, loading: true },
    potion: { done: false, loading: true }, // Simple check if they have a completed potion
  });

  useEffect(() => {
    if (!user) return;
    
    const checkTasks = async () => {
      // 1. Check Daily RP Slot
      const today = new Date().toISOString().split("T")[0];
      const { data: rpData } = await supabase
        .from("rp_daily_claims")
        .select("id")
        .eq("user_id", user.id)
        .eq("claim_date", today)
        .maybeSingle();

      // 2. Check Raid Boss
      const { data: raidData } = await supabase
        .from("events")
        .select("id")
        .eq("type", "raid_boss")
        .gte("end_time", new Date().toISOString())
        .lte("start_time", new Date().toISOString())
        .limit(1);

      // 3. Check Potions
      const { data: potionData } = await supabase
        .from("user_potions")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .limit(1);

      setTasks({
        rp_claim: { done: !!rpData, loading: false },
        raid_boss: { active: (raidData && raidData.length > 0) || false, loading: false },
        potion: { done: (potionData && potionData.length > 0) || false, loading: false },
      });
    };

    checkTasks();
    // Refresh every minute
    const interval = setInterval(checkTasks, 60000);
    return () => clearInterval(interval);
  }, [user]);

  if (tasks.rp_claim.loading) return null;

  const totalTasks = 3;
  let completed = 0;
  if (tasks.rp_claim.done) completed++;
  if (tasks.potion.done) completed++;
  if (!tasks.raid_boss.active) completed++; // Raid boss is not a task if not active, or counts as "safe"

  return (
    <div className="mb-6 bg-card/60 backdrop-blur-xl border border-primary/20 rounded-[2rem] p-5 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
        <EmojiIcon e="📜" />
      </div>

      <div className="flex items-center gap-3 mb-4 relative z-10">
        <div className="bg-primary/20 p-2 rounded-xl text-primary">
          <EmojiIcon e="🗺️" />
        </div>
        <div>
          <h3 className="font-heading text-lg text-primary leading-none">Diário do Maroto</h3>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">
            Seus objetivos do dia
          </p>
        </div>
      </div>

      <div className="space-y-2 relative z-10">
        {/* Daily RP */}
        <TaskItem 
          title="Assinar o Livro de Ponto"
          desc="Reivindique sua vaga diária para XP."
          done={tasks.rp_claim.done}
          link="#daily-rp-slot"
          icon={<CheckCircle2 size={16} />}
        />

        {/* Potions */}
        <TaskItem 
          title="Preparar Suprimentos"
          desc="Tenha pelo menos 1 poção pronta no Laboratório."
          done={tasks.potion.done}
          link="/dashboard/potions"
          icon={<Beaker size={16} />}
        />

        {/* Raid Boss Alert */}
        {tasks.raid_boss.active ? (
          <Link to="/dashboard/events" className="flex items-center gap-3 p-3 rounded-xl border border-red-500/50 bg-red-500/10 hover:bg-red-500/20 transition-all animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.2)]">
            <div className="text-red-400 shrink-0">
              <Skull size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-heading text-red-400">Invasão de Comensais!</p>
              <p className="text-[10px] uppercase tracking-widest text-red-400/70">O Chefe Raid está ativo. Lute agora!</p>
            </div>
            <ArrowRight size={16} className="text-red-400" />
          </Link>
        ) : (
          <TaskItem 
            title="Ameaças à Hogwarts"
            desc="O castelo está seguro... por enquanto."
            done={true}
            link="/dashboard/events"
            icon={<Shield size={16} />}
          />
        )}
      </div>
    </div>
  );
}

function TaskItem({ title, desc, done, link, icon }: any) {
  return (
    <a href={link} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${done ? 'bg-primary/5 border-primary/20 opacity-60' : 'bg-black/20 border-white/5 hover:border-primary/40 hover:bg-primary/10'}`}>
      <div className={`shrink-0 ${done ? 'text-primary' : 'text-muted-foreground'}`}>
        {done ? <CheckCircle2 size={16} /> : <Circle size={16} />}
      </div>
      <div className="shrink-0 text-muted-foreground">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-heading ${done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{title}</p>
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{desc}</p>
      </div>
    </a>
  );
}
