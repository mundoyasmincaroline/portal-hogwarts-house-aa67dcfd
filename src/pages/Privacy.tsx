import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Eye, Lock, Fingerprint } from "lucide-react";

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 selection:text-white">
      {/* Cinematic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-background to-background" />
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-20" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12 md:py-20">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-10 hover:bg-white/5 gap-2 group">
          <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          Voltar
        </Button>

        <div className="glass rounded-[3rem] p-8 md:p-16 border border-white/10 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-4 mb-8">
             <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
               <Lock size={28} />
             </div>
             <div>
               <h1 className="font-heading text-4xl text-gold-gradient tracking-tight">Privacidade</h1>
               <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Proteção de Memória e Dados</p>
             </div>
          </div>

          <div className="space-y-8 text-muted-foreground font-serif leading-relaxed text-base">
            <section className="space-y-4">
              <h2 className="text-xl font-heading text-foreground flex items-center gap-2">
                <span className="text-primary">01.</span> Coleta de Informações
              </h2>
              <p>
                Coletamos apenas as informações necessárias para sua jornada mágica: nome do bruxo, casa, XP e preferências de jogo. 
                Seus dados de login são protegidos por feitiços de criptografia avançados (Supabase Auth).
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-heading text-foreground flex items-center gap-2">
                <span className="text-primary">02.</span> Cookies Mágicos
              </h2>
              <p>
                Utilizamos cookies apenas para manter sua sessão ativa e salvar suas preferências de interface (como o modo escuro). 
                Não utilizamos cookies de rastreamento de terceiros fora do universo de Hogwarts.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-heading text-foreground flex items-center gap-2">
                <span className="text-primary">03.</span> Proteção de Dados
              </h2>
              <p>
                Suas mensagens e segredos na Penseira (Chat) são privados. Não vendemos ou compartilhamos suas informações com o Mundo Trouxa. 
                Sua segurança é nossa maior prioridade, protegida por políticas de Row Level Security (RLS).
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-heading text-foreground flex items-center gap-2">
                <span className="text-primary">04.</span> Seus Direitos
              </h2>
              <p>
                Você pode solicitar a exclusão de sua ficha de aluno a qualquer momento através das configurações de perfil ou 
                enviando uma coruja para o nosso suporte oficial.
              </p>
            </section>

            <div className="pt-10 border-t border-white/5 text-center">
              <p className="text-[10px] uppercase tracking-[0.4em] font-bold text-white/20">Protocolo de Segurança Ativo · Mundo Yasmin Caroline</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
