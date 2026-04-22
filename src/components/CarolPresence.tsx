import { Heart, Sparkles, BookOpen, Sun, Star, Zap, Mic, MicOff, Image as ImageIcon } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useVoice } from "@/hooks/useVoice";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";

/**
 * CAROL PRESENCE: The Christian Evangelical best friend for Carol.
 * She provides support, faith-based encouragement, and portal updates.
 */
const CarolPresence: React.FC = () => {
  const { profile } = useAuth();
  const { isListening, transcript, startListening, speak } = useVoice('carol');
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Identity check for Carol
  const isCarol = (profile?.username?.toLowerCase() || '').includes('carol') || 
                  (profile?.full_name?.toLowerCase() || '').includes('carol');

  useEffect(() => {
    if (isCarol) {
      setTimeout(() => {
        setIsVisible(true);
        
        // Proactive Faith-based notifications
        const interval = setInterval(() => {
          const messages = [
            "Carol, passando pra dizer que Deus está no controle de tudo. Essa fase vai passar! 🙏✨",
            "Amada, o portal teve uma evolução incrível hoje! O fruto do nosso trabalho está chegando. 🍇",
            "Olha esse versículo que lembrei de você: 'Tudo posso naquele que me fortalece.' (Filipenses 4:13) ❤️",
            "O Arquiteto está trabalhando duro e as coisas estão andando. Tenha fé, o melhor está por vir!",
            "Você é uma mulher forte e guerreira. Sinto muito orgulho da sua dedicação. ✨",
            "Bom dia, Carol! Que sua jornada hoje seja iluminada e cheia de paz. ☀️",
            "Sabia que mais bruxos entraram no portal agora? O projeto está crescendo muito! 🚀",
            "Descansa o coração, amada. Estamos construindo algo que vai mudar nossa realidade. 🏠🙌",
            "Deus não nos dá um fardo maior do que podemos carregar. Você é vitoriosa!",
            "Tô aqui cuidando de tudo pra que seja simples e abençoado pra você. Conte comigo! 🤝❤️"
          ];
          
          const randomMsg = messages[Math.floor(Math.random() * messages.length)];
          
          setIsTyping(true);
          setTimeout(() => {
            setIsTyping(false);
            toast(randomMsg, { 
              icon: "🙏", 
              description: "Sua amiga Helô",
              style: { 
                background: "rgba(255,255,255,0.95)", 
                border: "1px solid #fbbf24", 
                color: "#92400e",
                boxShadow: "0 0 15px rgba(251, 191, 36, 0.4)"
              },
              duration: 8000
            });
            speak(randomMsg); // Helô speaks!
          }, 3000);
        }, 240000); // Every 4 minutes

        return () => clearInterval(interval);
      }, 7000);
    }
  }, [isCarol]);

  const getHeloResponse = (userInput: string) => {
    const input = userInput.toLowerCase();
    if (input.includes('triste') || input.includes('difícil') || input.includes('mal')) {
      return "Carol, amada, sinto que seu coração está pesado hoje. Mas lembra: 'O choro pode durar uma noite, mas a alegria vem pela manhã'. Respira fundo, Deus está te sustentando. Quer que eu ore por você agora? 🙏❤️";
    }
    if (input.includes('casa') || input.includes('serviço') || input.includes('limpeza') || input.includes('almoço')) {
      return "Cuidar da casa é um ministério também, Carol! Faz tudo com amor, como se fosse para o Senhor. Mas não se sobrecarregue, viu? Tira um tempo pra você também, pra descansar essa mente guerreira. 🏠✨";
    }
    if (input.includes('cansada') || input.includes('exaurida')) {
      return "Eu sei o quanto você se esforça por todos. Você é o pilar! Mas até os guerreiros precisam de pausa. Senta um pouquinho, toma uma água e deixa que eu e o Arquiteto cuidamos das engrenagens do portal por aqui. 🧘‍♀️💖";
    }
    if (input.includes('projeto') || input.includes('portal') || input.includes('trabalho')) {
      return "O portal está ficando lindo! O Arquiteto está fazendo um trabalho de excelência e isso vai gerar muitos frutos pra sua família. Creia na promessa! 🍇🚀";
    }
    if (input.includes('oi') || input.includes('helô') || input.includes('olá')) {
      return "Oi, amada! Como está seu coração hoje? Tô aqui pra te ouvir e te apoiar. ✨";
    }
    return "Entendi, Carol. Estou guardando cada palavra sua nas minhas orações. Você é muito especial! 🙏";
  };

  // Auto-send when voice transcript is finished
  useEffect(() => {
    if (transcript && !isListening) {
      const response = getHeloResponse(transcript);
      toast(response, { 
        icon: "🙏", 
        description: "Helô te ouvindo",
        style: { background: "#fff", border: "1px solid #fbbf24", color: "#92400e" },
        duration: 8000 
      });
      speak(response);
    }
  }, [isListening]);

  return (
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end gap-3 group">
      {isTyping && (
        <div className="bg-white/90 border border-amber-400/50 px-4 py-1.5 rounded-2xl text-[10px] text-amber-700 font-heading italic animate-bounce shadow-lg">
          Helô está escrevendo... 🙏
        </div>
      )}

      {isListening && (
        <div className="bg-amber-100/90 border border-amber-400 px-4 py-2 rounded-2xl text-xs text-amber-900 font-bold animate-pulse shadow-xl">
           {transcript || "Ouvindo você, Carol... 🙏"}
        </div>
      )}
      
      <div className="relative flex items-center gap-4">
        <Button 
          size="icon" 
          variant="ghost" 
          onClick={() => navigate('/dashboard/profile')}
          className="w-10 h-10 rounded-full border border-amber-300 bg-white text-amber-500 hover:bg-amber-50 shadow-md"
          title="Gerar Retrato Mágico"
        >
          <ImageIcon size={18} />
        </Button>

        <Button 
          size="icon" 
          variant="ghost" 
          onClick={startListening}
          className={`w-10 h-10 rounded-full border border-amber-300 shadow-md transition-all ${isListening ? "bg-amber-500 text-white animate-pulse" : "bg-white text-amber-500 hover:bg-amber-50"}`}
        >
          <Mic size={18} />
        </Button>

        <div className="relative">
          {/* Golden Sun Aura */}
          <div className="absolute inset-[-10px] bg-yellow-400/20 rounded-full blur-xl animate-pulse group-hover:bg-yellow-400/40 transition-all" />
          
          <button
            className="w-16 h-16 rounded-full bg-white border-2 border-amber-400 flex items-center justify-center shadow-[0_0_25px_rgba(251,191,36,0.5)] group transition-all hover:scale-110 active:scale-95 overflow-hidden relative z-10"
            onClick={() => {
               const msg = "Oi Carol! Aqui é a Helô. Estou aqui orando por você e cuidando do portal. Tudo vai dar certo! ❤️";
               toast.info(msg);
               speak(msg);
            }}
          >
            <img src="/helo_portrait_friend_1776883301801.png" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Helô" />
            
            <div className="absolute inset-0 bg-gradient-to-tr from-amber-50/20 via-transparent to-yellow-200/20 opacity-40 group-hover:opacity-100 transition-opacity" />

            <div className="absolute -top-1 -left-1 bg-amber-500 rounded-full w-5 h-5 flex items-center justify-center text-[10px] text-white font-bold animate-bounce border border-white z-20">
              ✨
            </div>
          </button>
        </div>
      </div>

      <div className="mr-1 bg-white/80 backdrop-blur-md px-3 py-1 rounded-full border border-amber-200 shadow-sm flex flex-col gap-2">
        <p className="text-[9px] uppercase font-bold tracking-[0.2em] text-amber-700 flex items-center gap-1">
          <Star size={8} fill="currentColor" /> Amiga Helô
        </p>
        
        {isCarol && (
          <div className="flex gap-2 pb-1">
            <button 
              onClick={() => toast.info("Hoje o cronograma capilar sugere: Hidratação Profunda! ✨")}
              className="text-[8px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 px-2 py-0.5 rounded-md border border-amber-500/20 transition-colors"
            >
              Cabelo
            </button>
            <button 
              onClick={() => toast.info("Dica da Helô: Que tal uma massa com molho branco hoje? O Arquiteto ama! 🍝")}
              className="text-[8px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 px-2 py-0.5 rounded-md border border-amber-500/20 transition-colors"
            >
              Cardápio
            </button>
            <button 
              onClick={() => toast.info("O Thotty está dormindo agora, mas sonhando com você! 🐾")}
              className="text-[8px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 px-2 py-0.5 rounded-md border border-amber-500/20 transition-colors"
            >
              Thotty
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CarolPresence;
