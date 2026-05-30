import React, { useEffect, useState } from "react";
import { Newspaper, Sparkles, TrendingUp, Trophy, Zap } from "lucide-react";

const NEWS_ITEMS = [
  "🗞️ EXTRA! Grifinória assume a liderança na Taça das Casas com um feito heroico!",
  "🧪 O Prof. Snape alerta: 'Quem for pego com poções de amor será severamente punido'.",
  "🧹 Vassouras de última geração chegam à Loja Gringotts. Confira o novo estoque!",
  "🎭 Festival de Transfiguração começa amanhã no Grande Salão. Preparem suas varinhas!",
  "🦉 Relatórios indicam que o correio coruja está 20% mais rápido este semestre.",
  "✨ Novo artefato lendário foi avistado nas masmorras. Quem será o primeiro a encontrá-lo?",
  "🏆 O Ranking Global acaba de ser atualizado. Veja quem são os bruxos mais poderosos!",
  "📜 Lembrete: A Seção Reservada da Biblioteca continua proibida para alunos do 1º ano.",
  "🍭 Dedosdemel anuncia novos sabores de Feijõezinhos de Todos os Sabores. Cuidado com o de cera de ouvido!",
];

export default function DailyProphetTicker() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % NEWS_ITEMS.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full bg-black/90 backdrop-blur-xl border-y border-yellow-500/30 py-2 sm:py-3 overflow-hidden relative group shadow-[0_0_20px_rgba(0,0,0,0.5)]">
      <div className="absolute inset-y-0 left-0 w-16 sm:w-40 bg-gradient-to-r from-black via-black/80 to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-16 sm:w-40 bg-gradient-to-l from-black via-black/80 to-transparent z-10 pointer-events-none" />
      
      <div className="flex items-center whitespace-nowrap animate-marquee px-2 sm:px-4">
        {/* We repeat the items to ensure a smooth infinite scroll feel if it was a true marquee, 
            but here we'll do a fading transition for a more "premium" feel, or a slow scroll.
            Let's go with a slow scroll. */}
        <div className="flex items-center gap-12 animate-scroll-text">
          {NEWS_ITEMS.map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-yellow-500/50"><Sparkles size={12} className="sm:w-[14px] sm:h-[14px]" /></span>
              <span className="font-heading text-[10px] sm:text-xs uppercase tracking-widest text-yellow-100/80 hover:text-yellow-400 transition-colors cursor-default">
                {item}
              </span>
            </div>
          ))}
          {/* Duplicate for seamless loop */}
          {NEWS_ITEMS.map((item, i) => (
            <div key={`dup-${i}`} className="flex items-center gap-3">
              <span className="text-yellow-500/50"><Sparkles size={14} /></span>
              <span className="font-heading text-xs uppercase tracking-widest text-yellow-100/80 hover:text-yellow-400 transition-colors cursor-default">
                {item}
              </span>
            </div>
          ))}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scroll-text {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll-text {
          animation: scroll-text 60s linear infinite;
        }
        .animate-scroll-text:hover {
          animation-play-state: paused;
        }
      `}} />
    </div>
  );
}
