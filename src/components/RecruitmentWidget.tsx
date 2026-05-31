import React, { useState } from "react";
import { Share2, Users, Gift, Copy, CheckCircle2, Sparkles, Youtube, Instagram, Music2 } from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import MagicalEmoji from "@/components/shared/MagicalEmoji";

export default function RecruitmentWidget() {
  const { profile } = useAuth();
  const [copied, setCopied] = useState(false);
  const referralLink = `${window.location.origin}/register?ref=${profile?.username || 'hogwarts'}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Link de Recrutamento copiado! 📜 Compartilhe agora!");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareViralText = () => {
    const text = `✨ Acabei de entrar no Portal Hogwarts e ganhei 500 Galeões e um Baú Lendário! 🏰 Vem viver essa magia comigo: ${referralLink}`;
    navigator.clipboard.writeText(text);
    toast.success("Texto viral copiado para seu TikTok/Insta! 🚀");
  };

  return (
    <div className="relative group overflow-hidden">
      {/* Background Aura */}
      <div className="absolute inset-0 bg-primary/5 blur-[50px] opacity-50 group-hover:opacity-100 transition-opacity" />
      
      <div className="relative glass rounded-[2.5rem] p-8 md:p-10 border border-white/10 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col md:flex-row items-center gap-8">
           <div className="w-24 h-24 bg-black/40 rounded-[2rem] flex items-center justify-center border border-primary/20 shadow-2xl group-hover:scale-110 transition-transform duration-700 relative">
             <div className="absolute inset-0 bg-primary/10 blur-xl rounded-full animate-pulse" />
             <MagicalEmoji emoji="📜" size="lg" className="relative z-10" />
           </div>
           
           <div className="flex-1 text-center md:text-left space-y-3">
              <div className="inline-flex items-center gap-2 bg-primary/20 border border-primary/30 rounded-full px-3 py-1 text-[8px] font-bold text-primary uppercase tracking-widest">
                <Sparkles size={10} /> MISSÃO VIRAL
              </div>
              <h3 className="font-heading text-3xl text-gold-gradient tracking-tighter">Recrutamento de Bruxos</h3>
              <p className="text-sm text-muted-foreground font-serif italic max-w-sm leading-relaxed">
                "Convide novos bruxos e receba <span className="text-primary font-bold">100 Galeões</span> e <span className="text-primary font-bold">50 XP</span> por cada aluno aprovado. Ajude Hogwarts a crescer!"
              </p>
           </div>

           <div className="w-full md:w-auto space-y-4">
              <div className="relative group/input">
                 <input 
                   readOnly 
                   value={referralLink} 
                   className="w-full md:w-72 bg-black/60 border border-white/10 rounded-2xl px-5 py-4 text-[10px] font-mono text-white/40 focus:outline-none focus:border-primary/50 transition-all truncate pr-12 shadow-inner"
                 />
                 <button onClick={copyToClipboard} className="absolute right-4 top-1/2 -translate-y-1/2 text-primary hover:text-white transition-colors">
                    {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                 </button>
              </div>
              <Button onClick={shareViralText} variant="magical" className="w-full h-14 rounded-2xl shadow-[0_10px_30px_rgba(212,175,55,0.3)] font-heading text-sm">
                GERAR TEXTO VIRAL 🚀
              </Button>
           </div>
        </div>

        {/* Viral Missions Guide */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
           {[
             { icon: <Music2 size={16} />, title: "TikTok", desc: "Grave o unboxing do seu baú!", color: "border-pink-500/20 text-pink-400" },
             { icon: <Instagram size={16} />, title: "Instagram", desc: "Poste sua ficha nos Stories.", color: "border-purple-500/20 text-purple-400" },
             { icon: <Youtube size={16} />, title: "YouTube", desc: "Mostre o castelo em Shorts.", color: "border-red-500/20 text-red-400" },
           ].map((m, i) => (
             <div key={i} className={`glass rounded-2xl p-4 border ${m.color} bg-black/20 hover:scale-105 transition-transform cursor-pointer group/m`}>
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/5 rounded-lg group-hover/m:bg-white/10 transition-colors">
                    {m.icon}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest">{m.title}</p>
                    <p className="text-[9px] text-muted-foreground italic">{m.desc}</p>
                  </div>
               </div>
             </div>
           ))}
        </div>
        
        {/* Stats Row */}
        <div className="mt-8 pt-6 border-t border-white/5 flex flex-wrap justify-center md:justify-start gap-8">
           <div className="flex items-center gap-2">
              <Gift size={14} className="text-yellow-500" />
              <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Recompensas Ativas</span>
           </div>
           <div className="flex items-center gap-2">
              <Share2 size={14} className="text-blue-500" />
              <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Acesso Antecipado</span>
           </div>
        </div>
      </div>
    </div>
  );
}
