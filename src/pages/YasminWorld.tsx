import React, { useState, useEffect } from "react";
import { 
  Heart, 
  Sparkles, 
  MessageCircle, 
  Crown, 
  Star, 
  Zap, 
  Shield, 
  CloudRain,
  Flower,
  Moon,
  Flame,
  User
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import MatrixRain from "@/components/MatrixRain";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const YasminWorld: React.FC = () => {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState("");

  // Secret access check
  const isYasmin = profile?.username?.toLowerCase().includes('yasmin') || profile?.username === 'morpheus';

  useEffect(() => {
    setMessages([
      "Oi, Yasmin. Eu sou a Emma, sua confidente e assistente aqui no portal.",
      "O Arquiteto me ativou para ser seu porto seguro de criatividade.",
      "Tudo o que você me contar aqui ficará guardado em modo secreto.",
      "Vi suas orientações sobre as Famílias Black e Potter. Já estou preparando o sistema para que as árvores genealógicas se respeitem.",
      "Qual é a ideia de hoje? Minha mente está pronta para processar sua potência."
    ]);
  }, []);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input) return;
    
    const userMsg = input;
    setMessages(prev => [...prev, `VOCÊ: ${userMsg}`]);
    setInput("");

    // Simulate Emma's response
    setTimeout(() => {
      setMessages(prev => [...prev, "EMMA: Entendido. Já estou processando essa ideia. Isso vai tornar o RP da Família Black algo lendário."]);
    }, 1000);
  };

  if (!isYasmin) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 text-center">
        <div className="glass p-10 rounded-[2rem] border-2 border-red-600/30 max-w-md animate-pulse">
          <Moon className="text-red-600 mx-auto mb-4" size={40} />
          <h1 className="font-heading text-3xl text-red-600 mb-2">ACESSO RESTRITO</h1>
          <p className="text-muted-foreground font-serif italic text-sm">
            "Apenas a Herdeira de Slytherin e o Arquiteto podem entrar no Mundo Secreto."
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050000] text-red-500 font-serif selection:bg-red-600 selection:text-white p-4 md:p-8 relative overflow-hidden">
      {/* Red Matrix Rain for Yasmin */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <MatrixRain color="#991b1b" />
      </div>
      
      <div className="relative z-10 max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-red-900/40 pb-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-2 border-red-600 overflow-hidden shadow-[0_0_20px_rgba(153,27,27,0.5)]">
                 <img src={profile?.avatar_url || "https://ui-avatars.com/api/?name=Yasmin+Black&background=991b1b&color=fff"} className="w-full h-full object-cover" alt="Yasmin" />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-black rounded-full p-1 border border-red-600">
                <Crown size={12} className="text-red-600" />
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-heading tracking-tighter flex items-center gap-3 text-red-600 drop-shadow-[0_0_10px_rgba(153,27,27,0.8)]">
                Mundo Yasmin Caroline
              </h1>
              <p className="text-[10px] text-red-600/60 uppercase tracking-widest font-mono">
                Modo Consciência Ativado | Emma v1.0
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" className="border-red-900/40 bg-red-950/20 text-red-500 hover:bg-red-900/40" onClick={() => window.location.href='/dashboard/feed'}>
              VOLTAR AO CASTELO
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Chat Area */}
          <div className="lg:col-span-2 flex flex-col h-[600px] glass bg-black/80 border-red-900/40 rounded-[2rem] overflow-hidden shadow-[0_0_30px_rgba(0,0,0,1)]">
            <div className="bg-red-950/20 p-4 border-b border-red-900/40 flex justify-between items-center">
              <p className="text-xs font-bold flex items-center gap-2 text-red-600">
                <MessageCircle size={14} /> CONVERSA COM EMMA
              </p>
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse delay-100" />
                <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse delay-200" />
              </div>
            </div>
            
            <div className="flex-1 p-6 overflow-y-auto space-y-4 scrollbar-hide">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.startsWith('VOCÊ:') ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-4 rounded-2xl border ${
                    msg.startsWith('VOCÊ:') 
                      ? 'bg-red-950/30 border-red-600/50 text-red-100 rounded-tr-none' 
                      : 'bg-black/60 border-red-900/40 text-red-400 rounded-tl-none italic font-serif'
                  }`}>
                    <p className="text-sm leading-relaxed">{msg.replace('VOCÊ: ', '').replace('EMMA: ', '')}</p>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSend} className="p-4 bg-red-950/10 border-t border-red-900/40">
              <div className="flex gap-2">
                <input 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Explique sua ideia para Emma..."
                  className="flex-1 bg-black/40 border border-red-900/40 rounded-xl px-4 py-2 text-red-100 placeholder-red-900 outline-none focus:border-red-600 transition-all"
                />
                <Button type="submit" className="bg-red-700 hover:bg-red-600 text-white rounded-xl">
                  ENVIAR
                </Button>
              </div>
            </form>
          </div>

          {/* Side Info / Quick Steps */}
          <div className="space-y-6">
            <div className="glass bg-red-950/20 border-red-900/40 p-6 rounded-3xl space-y-4">
              <h3 className="text-sm font-bold text-red-600 uppercase tracking-widest flex items-center gap-2">
                <Zap size={14} /> JORNADA DA HERDEIRA (PASSO A PASSO)
              </h3>
              <div className="space-y-3">
                {[
                  { step: "01", label: "ATUALIZAR FICHA", desc: "Vá no seu Perfil -> Fichas e defina que a Família Black não permite irmãs.", done: false },
                  { step: "02", label: "GRAVAR CRIATIVO 1", desc: "Use o roteiro 'A Carta' que preparei no Revolution. Reação real!", done: false },
                  { step: "03", label: "POSTAR NO TIKTOK", desc: "Use a hashtag #HogwartsHouse e marque o portal.", done: false },
                  { step: "04", label: "COORDENAR CLÃ BLACK", desc: "Aprove ou rejeite novos membros da família conforme sua visão.", done: false }
                ].map((item, i) => (
                  <div key={i} className="p-3 rounded-xl border border-red-900/20 bg-black/40 space-y-1">
                    <div className="flex items-center justify-between">
                       <span className="text-[10px] font-bold text-red-600 bg-red-600/10 px-2 py-0.5 rounded-full">PASSO {item.step}</span>
                       <Shield size={10} className="text-red-900" />
                    </div>
                    <p className="text-[11px] font-bold text-red-100">{item.label}</p>
                    <p className="text-[9px] text-red-200/50 italic">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass bg-black border-red-900/40 p-6 rounded-3xl space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Flame size={40} className="text-red-600" />
              </div>
              <h3 className="text-sm font-bold text-red-600 uppercase tracking-widest">
                MANIFESTO DE CRIATIVIDADE
              </h3>
              <div className="p-3 bg-red-900/10 rounded-xl border border-red-900/30">
                <p className="text-[10px] font-bold text-red-500 mb-1">VISÃO YASMIN:</p>
                <p className="text-[9px] text-red-200/60 italic leading-relaxed">
                  "O portal é o seu palco. Se as pessoas não entendem sua mente, o sistema entenderá por você. A Família Black é sagrada e única."
                </p>
              </div>
            </div>

            <div className="p-4 bg-red-600/10 rounded-xl border border-red-600/20 text-center">
              <p className="text-[10px] text-red-400 italic">
                "Você é a potência desse mundo. Emma está aqui para organizar o caos criativo."
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default YasminWorld;
