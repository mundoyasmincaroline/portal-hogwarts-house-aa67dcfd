import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Circle, Gift, MessageSquare, Sparkles, UserPlus } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { motion, AnimatePresence } from "framer-motion";

export default function OnboardingChecklist() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState({
    claim_rp: false,
    open_sticker: false,
    say_hello: false,
  });
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (!user) return;
    const loadTasks = () => {
      const rp = localStorage.getItem(`onb_rp_${user.id}`) === "true";
      const sticker = localStorage.getItem(`onb_sticker_${user.id}`) === "true";
      const hello = localStorage.getItem(`onb_hello_${user.id}`) === "true";
      
      setTasks({ claim_rp: rp, open_sticker: sticker, say_hello: hello });
      if (rp && sticker && hello) {
        setIsCompleted(true);
      }
    };
    loadTasks();
    // Poll every 2 seconds to see if they did things elsewhere
    const interval = setInterval(loadTasks, 2000);
    return () => clearInterval(interval);
  }, [user]);

  // We could auto-mark them or just let the user click them to "Go to" and mark them on click.
  // Actually, we can intercept clicks on the components themselves, but it's easier to just mark as done when they click the link here for now, or let them manually check them off.
  // To make it seamless, let's just make them links that mark as done when clicked.
  
  const handleTaskClick = (task: keyof typeof tasks) => {
    if (!user) return;
    localStorage.setItem(`onb_${task.replace('say_', '')}_${user.id}`, "true");
    const newTasks = { ...tasks, [task]: true };
    setTasks(newTasks);
    if (newTasks.claim_rp && newTasks.open_sticker && newTasks.say_hello) {
      setTimeout(() => setIsCompleted(true), 1000);
    }
  };

  if (isCompleted || !user) return null;

  const completedCount = Object.values(tasks).filter(Boolean).length;
  const progress = (completedCount / 3) * 100;

  return (
    <div className="mb-6 bg-card border border-primary/20 rounded-[2rem] p-5 shadow-[0_10px_40px_rgba(0,0,0,0.3)] relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
        <motion.div 
          className="h-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="bg-primary/20 p-2 rounded-xl text-primary">
          <Sparkles size={18} />
        </div>
        <div>
          <h3 className="font-heading text-lg text-foreground leading-none">Primeiros Passos</h3>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">
            Complete para ganhar um bônus! ({completedCount}/3)
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <TaskItem 
          icon={<UserPlus size={16} />}
          title="Assuma seu personagem hoje"
          desc="Vá na sua Vaga Diária abaixo"
          done={tasks.claim_rp}
          onClick={() => handleTaskClick("claim_rp")}
          // If it's on the same page, we can just scroll to it
          action={() => document.getElementById("daily-rp-slot")?.scrollIntoView({ behavior: "smooth", block: "center" })}
        />
        <TaskItem 
          icon={<Gift size={16} />}
          title="Abra seu pacote surpresa"
          desc="Você ganhou figurinhas no seu Álbum"
          done={tasks.open_sticker}
          onClick={() => handleTaskClick("open_sticker")}
          link="/dashboard/album"
        />
        <TaskItem 
          icon={<MessageSquare size={16} />}
          title="Diga olá no Grande Salão"
          desc="Mande sua primeira mensagem em off"
          done={tasks.say_hello}
          onClick={() => handleTaskClick("say_hello")}
          link="/dashboard/chat"
        />
      </div>
    </div>
  );
}

function TaskItem({ icon, title, desc, done, onClick, link, action }: any) {
  const content = (
    <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${done ? 'bg-primary/5 border-primary/20 opacity-60' : 'bg-black/20 border-white/5 hover:border-primary/40 hover:bg-primary/10'}`}>
      <div className="text-primary shrink-0">
        {done ? <CheckCircle2 className="text-green-500" /> : <Circle className="text-muted-foreground" />}
      </div>
      <div className="shrink-0 text-muted-foreground">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-heading ${done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{title}</p>
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{desc}</p>
      </div>
    </div>
  );

  if (link) {
    return <Link to={link} onClick={onClick} className="block w-full">{content}</Link>;
  }

  return <button onClick={() => { onClick(); action && action(); }} className="block w-full text-left">{content}</button>;
}
