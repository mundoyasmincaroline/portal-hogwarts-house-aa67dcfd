import React, { useState } from "react";
import { Share2, Users, Gift, Copy, CheckCircle2 } from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

export default function RecruitmentWidget() {
  const { profile } = useAuth();
  const [copied, setCopied] = useState(false);
  const referralLink = `${window.location.origin}/register?ref=${profile?.username || 'hogwarts'}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Link de Recrutamento copiado! 📜");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group overflow-hidden">
      {/* Background Aura */}
      <div className="absolute inset-0 bg-primary/5 blur-[50px] opacity-50 group-hover:opacity-100 transition-opacity" />
      
      <div className="relative glass rounded-[2.5rem] p-8 md:p-10 border border-white/10 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col md:flex-row items-center gap-8">
           <div className="w-20 h-20 bg-primary/10 rounded-[1.5rem] flex items-center justify-center border border-primary/20 shadow-inner group-hover:rotate-6 transition-transform duration-500">
             <Users size={32} className="text-primary animate-pulse" />
           </div>
           
           <div className="flex-1 text-center md:text-left space-y-2">
              <h3 className="font-heading text-2xl text-gold-gradient tracking-tight">Recrutamento de Bruxos</h3>
              <p className="text-sm text-muted-foreground font-serif italic max-w-sm">
                "Convide novos bruxos para o portal e receba <span className="text-primary font-bold">100 Galeões</span> e <span className="text-primary font-bold">50 XP</span> por cada aluno aprovado."
              </p>
           </div>

           <div className="w-full md:w-auto space-y-3">
              <div className="relative group/input">
                 <input 
                   readOnly 
                   value={referralLink} 
                   className="w-full md:w-64 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-[10px] font-mono text-white/50 focus:outline-none focus:border-primary/50 transition-all truncate pr-10"
                 />
                 <button onClick={copyToClipboard} className="absolute right-3 top-1/2 -translate-y-1/2 text-primary hover:text-primary/80 transition-colors">
                    {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                 </button>
              </div>
              <Button onClick={copyToClipboard} variant="magical" className="w-full h-12 rounded-xl shadow-lg">
                Copiar Convite Mágico
              </Button>
           </div>
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
