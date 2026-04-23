import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, X, Bell, ShieldAlert, Zap, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OwlMessage {
  id: string;
  title: string;
  content: string;
  type: 'warning' | 'alert' | 'reward' | 'info';
  created_at: string;
}

export default function Corujoteca() {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<OwlMessage[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hasNew, setHasNew] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Simular verificação de inatividade e mensagens do Filch/Hogwarts
    const checkStatus = () => {
      const msgs: OwlMessage[] = [];
      const lastSeen = profile?.last_seen ? new Date(profile.last_seen).getTime() : Date.now();
      const inactiveDays = Math.floor((Date.now() - lastSeen) / 86400000);

      if (inactiveDays >= 1) {
        msgs.push({
          id: 'filch_watch',
          title: '📜 Aviso do Filch',
          content: `Cuidado! Você está ausente há ${inactiveDays} dia(s). Filch está patrulhando os corredores e de olho na sua ficha!`,
          type: 'alert',
          created_at: new Date().toISOString()
        });
      }

      if (profile?.xp && profile.xp > 1000) {
        msgs.push({
          id: 'minister_notice',
          title: '🕊️ Carta de Edwiges',
          content: 'Sua participação nas aulas tem sido exemplar. O Ministério da Magia enviou uma recomendação positiva para o seu histórico!',
          type: 'reward',
          created_at: new Date().toISOString()
        });
      }

      setMessages(msgs);
      if (msgs.length > 0) setHasNew(true);
    };

    checkStatus();
  }, [user, profile]);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
    setHasNew(false);
  };

  if (!user) return null;

  return (
    <>
      {/* ── BOTÃO CORUJOTECA (EDWIGES) ── */}
      <button
        onClick={toggleOpen}
        className={`fixed bottom-24 left-6 z-[60] group transition-all duration-500 ${isOpen ? 'scale-0' : 'scale-100'}`}
      >
        <div className="relative">
          {hasNew && (
            <>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-black z-10 animate-bounce" />
              {/* Flying Hedwig Sprite/Animation */}
              <div className="absolute -top-20 -left-10 pointer-events-none animate-float-slow">
                <span className="text-4xl filter drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">🦉</span>
              </div>
            </>
          )}
          <div className={`p-5 rounded-3xl glass border-2 transition-all duration-700 shadow-2xl relative overflow-hidden ${hasNew ? 'border-primary animate-pulse shadow-[0_0_40px_rgba(212,175,55,0.3)] bg-primary/5' : 'border-white/10 hover:border-primary/50'
            }`}>
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <Mail className={`w-7 h-7 relative z-10 ${hasNew ? 'text-primary animate-bounce' : 'text-muted-foreground group-hover:text-primary'}`} />
          </div>

          <div className="absolute left-full ml-6 top-1/2 -translate-y-1/2 bg-black/90 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-primary/20 opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0 pointer-events-none whitespace-nowrap shadow-2xl">
            <p className="text-[10px] font-heading text-primary uppercase tracking-widest font-bold flex items-center gap-2">
              <Sparkles size={10} className="animate-pulse" /> Corujoteca
            </p>
            <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter">
              {messages.length > 0 ? `${messages.length} Pergaminhos Pendentes` : "Nenhum correio novo"}
            </p>
          </div>
        </div>
      </button>

      {/* ── PAINEL DE MENSAGENS (O PERGAMINHO) ── */}
      {isOpen && (
        <div className="fixed inset-0 lg:inset-auto lg:bottom-24 lg:left-24 lg:w-96 lg:h-[600px] z-[100] animate-in fade-in slide-in-from-left-5 duration-500">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm lg:hidden" onClick={() => setIsOpen(false)} />

          <div className="relative h-full flex flex-col glass rounded-[2.5rem] border-2 border-primary/30 shadow-[0_30px_100px_rgba(0,0,0,0.8)] overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/parchment.png')] opacity-10 pointer-events-none" />

            <div className="p-8 border-b border-white/10 flex justify-between items-center relative z-10">
              <div>
                <h3 className="font-heading text-2xl text-gold-gradient">Corujoteca</h3>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Correio por Coruja de Hogwarts</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors text-muted-foreground">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 relative z-10 custom-scrollbar">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                  <Mail size={48} className="mb-4" />
                  <p className="font-serif italic italic italic italic">"Nenhuma coruja sobrevoando o castelo no momento..."</p>
                </div>
              ) : (
                messages.map(msg => (
                  <div key={msg.id} className="glass bg-white/5 border border-white/10 p-5 rounded-3xl relative group hover:border-primary/30 transition-all">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-2xl shrink-0 ${msg.type === 'alert' ? 'bg-red-500/10 text-red-400' :
                          msg.type === 'reward' ? 'bg-green-500/10 text-green-400' :
                            'bg-primary/10 text-primary'
                        }`}>
                        {msg.type === 'alert' ? <ShieldAlert size={20} /> : <Zap size={20} />}
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-heading text-sm text-white">{msg.title}</h4>
                        <p className="text-xs text-muted-foreground font-serif leading-relaxed">"{msg.content}"</p>
                        <p className="text-[8px] text-white/20 uppercase font-bold pt-2">{new Date(msg.created_at).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-6 border-t border-white/10 relative z-10">
              <Button variant="outline" className="w-full rounded-2xl h-12 text-xs border-primary/20 text-primary hover:bg-primary/10" onClick={() => setIsOpen(false)}>
                Fechar Pergaminhos
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
