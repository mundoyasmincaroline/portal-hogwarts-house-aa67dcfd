import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Scroll, ShieldCheck, Scale } from "lucide-react";

export default function Terms() {
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
               <Scale size={28} />
             </div>
             <div>
               <h1 className="font-heading text-4xl text-gold-gradient tracking-tight">Termos de Uso</h1>
               <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Diretrizes do Ministério da Magia</p>
             </div>
          </div>

          <div className="space-y-8 text-muted-foreground font-serif leading-relaxed text-base">
            <section className="space-y-4">
              <h2 className="text-xl font-heading text-foreground flex items-center gap-2">
                <span className="text-primary">01.</span> Aceitação dos Termos
              </h2>
              <p>
                Ao acessar o Portal Hogwarts House, você concorda em cumprir estes termos de serviço, todas as leis e regulamentos aplicáveis. 
                Este é um projeto de fã, sem fins lucrativos oficiais de copyright, mas que utiliza sistemas de gamificação para manutenção do servidor.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-heading text-foreground flex items-center gap-2">
                <span className="text-primary">02.</span> Conduta do Bruxo
              </h2>
              <p>
                O uso de maldições imperdoáveis (bullying, preconceito, spam ou assédio) resultará em banimento imediato para Azkaban. 
                Respeite os outros membros da comunidade e mantenha o decoro no Grande Salão e nas salas comunais.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-heading text-foreground flex items-center gap-2">
                <span className="text-primary">03.</span> Propriedade Intelectual
              </h2>
              <p>
                Hogwarts House é uma plataforma de fãs inspirada no universo Wizarding World. Não somos afiliados à Warner Bros. Entertainment Inc. 
                ou à J.K. Rowling. Todo o conteúdo gerado por usuários pertence à comunidade, mas o design e o código são de propriedade do Mundo Yasmin Caroline.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-heading text-foreground flex items-center gap-2">
                <span className="text-primary">04.</span> Gringotts e Transações
              </h2>
              <p>
                As transações de Galeões e VIP são destinadas exclusivamente à manutenção e evolução do portal. Uma vez consumidos, 
                os itens mágicos não são reembolsáveis, exceto por falhas técnicas comprovadas pelo Ministério (Suporte).
              </p>
            </section>

            <div className="pt-10 border-t border-white/5 text-center">
              <p className="text-[10px] uppercase tracking-[0.4em] font-bold text-white/20">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
