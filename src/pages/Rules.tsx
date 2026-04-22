import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Scroll, ShieldAlert, Zap, Sparkles, Feather } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import MagicalEmoji from "@/components/MagicalEmoji";

export default function Rules() {
  const [revealed, setRevealed] = useState(false);
  const [sworn, setSworn] = useState(false);
  const navigate = useNavigate();

  const handleSwear = () => {
    setSworn(true);
    setTimeout(() => setRevealed(true), 800);
    toast.success("Mischief Managed... A honra é sua, bruxo.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-black/40">
      <div className={`relative max-w-4xl w-full transition-all duration-1000 transform ${revealed ? 'scale-100' : 'scale-95 opacity-90'}`}>
        
        {/* Parchment Container */}
        <div className="relative bg-[#d4b996] rounded-sm shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-[12px] border-[#8b7355] p-1 overflow-hidden min-h-[80vh]">
          {/* Paper Texture Overlay */}
          <div className="absolute inset-0 opacity-40 mix-blend-multiply pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/parchment.png')]" />
          <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
          
          {/* Ink Borders */}
          <div className="absolute inset-4 border border-[#5d4037]/30 rounded-sm pointer-events-none" />
          <div className="absolute inset-6 border-2 border-[#5d4037]/10 rounded-sm pointer-events-none" />

          <div className="relative z-10 p-8 md:p-12 h-full flex flex-col">
            
            {!revealed ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-12 py-20">
                <div className="space-y-4">
                  <MagicalEmoji emoji="📜" size="lg" className="mx-auto grayscale opacity-80" />
                  <h1 className="font-heading text-4xl text-[#5d4037] drop-shadow-sm">O Juramento do Bruxo</h1>
                  <p className="text-[#5d4037]/70 font-serif italic max-w-md mx-auto text-lg">
                    "Para entrar neste mundo, é preciso mais que uma varinha. É preciso honra."
                  </p>
                </div>

                <div className="space-y-6 w-full max-w-sm">
                  <Button 
                    variant="plaque" 
                    onClick={handleSwear}
                    className={`w-full h-20 text-xl bg-[#5d4037] hover:bg-[#3e2723] border-[#3e2723] transition-all duration-700 ${sworn ? 'opacity-0 scale-110' : 'opacity-100'}`}
                  >
                    Eu juro solenemente não fazer nada de bom
                  </Button>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-[#5d4037]/50 font-bold">Toque para revelar os segredos</p>
                </div>
              </div>
            ) : (
              <div className="animate-in fade-in zoom-in duration-1000 space-y-10">
                {/* Header */}
                <div className="text-center space-y-4">
                  <div className="flex justify-center gap-4 text-[#5d4037]/40 mb-4">
                    <Feather className="animate-bounce" />
                    <Scroll />
                    <Sparkles className="animate-pulse" />
                  </div>
                  <h1 className="font-heading text-3xl md:text-5xl text-[#3e2723] tracking-tighter">
                    𝐎𝐬 𝐃𝐞𝐜𝐫𝐞𝐭𝐨𝐬 𝐝𝐞 𝐇𝐨𝐠𝐰𝐚𝐫𝐭𝐬 𝐇𝐨𝐮𝐬𝐞
                  </h1>
                  <div className="h-1 w-32 bg-gradient-to-r from-transparent via-[#5d4037]/40 to-transparent mx-auto" />
                  <p className="text-[#5d4037] font-serif italic text-lg mt-4 max-w-2xl mx-auto leading-relaxed">
                    "Não é brincadeira, é um privilégio. Você foi escolhido para trilhar os corredores desta castelo. Honre seu nome, sua casa e seus companheiros."
                  </p>
                </div>

                {/* Rules Content - Ink style */}
                <div className="grid md:grid-cols-2 gap-8 text-[#3e2723]">
                  <div className="space-y-8">
                    <div className="space-y-2 border-l-2 border-[#5d4037]/20 pl-6">
                      <h3 className="font-heading text-xl flex items-center gap-2">
                        <span className="text-2xl opacity-60">I.</span> A Lei do Respeito
                      </h3>
                      <p className="text-sm font-serif italic leading-relaxed opacity-80">
                        Bruxos e bruxas de todas as origens são bem-vindos. Ofensas, preconceitos ou desrespeito resultarão em banimento imediato para Azkaban. Aqui, a amizade é a magia mais forte.
                      </p>
                    </div>

                    <div className="space-y-2 border-l-2 border-[#5d4037]/20 pl-6">
                      <h3 className="font-heading text-xl flex items-center gap-2">
                        <span className="text-2xl opacity-60">II.</span> O Código de Etiqueta
                      </h3>
                      <p className="text-sm font-serif italic leading-relaxed opacity-80">
                        Calls são sagradas e realizadas apenas via Meet. Não interrompa o fluxo de magia com ligações de WhatsApp. A organização dos grupos é a ordem do castelo.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="space-y-2 border-l-2 border-[#5d4037]/20 pl-6">
                      <h3 className="font-heading text-xl flex items-center gap-2 text-red-900">
                        <span className="text-2xl opacity-60">III.</span> Seção Proibida (+18)
                      </h3>
                      <p className="text-sm font-serif italic leading-relaxed opacity-80">
                        Conteúdos impróprios, palavras de baixo calão e temas adultos são estritamente proibidos. Mantenha a pureza do ambiente escolar.
                      </p>
                    </div>

                    <div className="space-y-2 border-l-2 border-[#5d4037]/20 pl-6">
                      <h3 className="font-heading text-xl flex items-center gap-2">
                        <span className="text-2xl opacity-60">IV.</span> A Maldição do Spam
                      </h3>
                      <p className="text-sm font-serif italic leading-relaxed opacity-80">
                        Evite o uso excessivo de mensagens repetidas e figurinhas. A clareza da comunicação é vital para nossos RPGs e aulas.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer Warning */}
                <div className="mt-12 p-8 border-2 border-dashed border-[#5d4037]/30 bg-black/5 rounded-sm text-center space-y-6">
                  <ShieldAlert className="mx-auto text-red-900 w-12 h-12 opacity-80" />
                  <div className="space-y-2">
                    <h4 className="font-heading text-xl text-red-900 uppercase tracking-widest">Aviso do Ministério</h4>
                    <p className="text-sm font-serif italic text-[#3e2723] max-w-lg mx-auto">
                      "A quebra destes decretos resultará em remoção imediata. O Filch está sempre vigiando. Honre sua presença aqui."
                    </p>
                  </div>
                  
                  <div className="pt-6">
                    <Button 
                      variant="plaque" 
                      onClick={() => navigate("/dashboard")}
                      className="h-16 px-12 bg-[#3e2723] text-white border-none shadow-xl hover:scale-105 transition-all"
                    >
                      Eu aceito os termos e entro no Castelo
                    </Button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Decorative Map Corners */}
        <div className="absolute -top-4 -left-4 w-16 h-16 border-t-4 border-l-4 border-[#8b7355] rounded-tl-xl pointer-events-none" />
        <div className="absolute -top-4 -right-4 w-16 h-16 border-t-4 border-r-4 border-[#8b7355] rounded-tr-xl pointer-events-none" />
        <div className="absolute -bottom-4 -left-4 w-16 h-16 border-b-4 border-l-4 border-[#8b7355] rounded-bl-xl pointer-events-none" />
        <div className="absolute -bottom-4 -right-4 w-16 h-16 border-b-4 border-r-4 border-[#8b7355] rounded-br-xl pointer-events-none" />
      </div>

      <style>{`
        @font-face {
          font-family: 'ParchmentFont';
          src: url('https://fonts.googleapis.com/css2?family=UnifrakturMaguntia&display=swap');
        }
        .font-parchment { font-family: 'UnifrakturMaguntia', cursive; }
      `}</style>
    </div>
  );
}
