import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { 
  Calendar, 
  Heart, 
  Sparkles, 
  Utensils, 
  Film, 
  Zap, 
  Moon, 
  Smile,
  Baby
} from "lucide-react";

/**
 * CarolAgenda: O motor de inteligência por trás da Helô.
 * Gerencia ciclo, cabelo, cardápio, aniversários e o Thotty.
 */
export default function CarolAgenda() {
  const { user, profile } = useAuth();
  const [lastCheck, setLastCheck] = useState<string | null>(null);

  const isCarol = (profile?.username?.toLowerCase() || '').includes('carol') || 
                  (profile?.full_name?.toLowerCase() || '').includes('carol') ||
                  profile?.username === 'morpheus'; // Morpheus vê para testar

  useEffect(() => {
    if (!user || !isCarol) return;

    const runAgendaLogic = () => {
      const now = new Date();
      const hour = now.getHours();
      const today = now.toLocaleDateString();

      if (lastCheck === today) return;

      // 1. Elogio à Comida (Perto do almoço ou janta)
      if (hour >= 11 && hour <= 13) {
        notifyHelo(
          "Carol, o cheirinho desse almoço deve estar divino! 🍲✨",
          "Você cozinha com tanto amor, amada. O Arquiteto e a Yasmin têm muita sorte. Já pensou no cardápio de hoje?",
          <Utensils className="text-amber-600" size={20} />
        );
      } else if (hour >= 19 && hour <= 21) {
        notifyHelo(
          "Que banquete, hein Carol? 🌙🥘",
          "Nada supera o seu tempero. Depois desse jantar, que tal um filme com a família? Sugiro um romance ou algo leve!",
          <Film className="text-pink-500" size={20} />
        );
      }

      // 2. Cuidados com o Cabelo (Manhã)
      if (hour >= 8 && hour <= 10) {
        const tips = [
          "Hoje é dia de Hidratação! Seus fios vão brilhar como ouro. ✨",
          "Amada, hoje o foco é Nutrição. Seus cabelos merecem esse carinho.",
          "Dia de reconstrução! Força total para essa leoa guerreira. 🦁💖"
        ];
        notifyHelo(
          "Hora da Beleza! 🧴✨",
          tips[Math.floor(Math.random() * tips.length)],
          <Sparkles className="text-amber-400" size={20} />
        );
      }

      // 3. O Thotty (Tarde)
      if (hour >= 15 && hour <= 17) {
        notifyHelo(
          "O Thotty mandou um beijo! 🐾❤️",
          "Ele está aqui pulando e dizendo que você é a melhor 'mãe' do mundo. Não esquece de dar um cheiro nele daqui a pouco!",
          <Baby className="text-blue-400" size={20} />
        );
      }

      // 4. Ciclo Menstrual (Aproximado/Simulado para demonstração)
      // Nota: Em um sistema real, isso viria do banco de dados
      const dayOfMonth = now.getDate();
      if (dayOfMonth >= 25) {
        notifyHelo(
          "Momento de Autocuidado 🌸",
          "Seu ciclo está próximo. Tira um tempo pra descansar, toma um chá de camomila e deixa o Arquiteto cuidar de tudo hoje. Você merece paz.",
          <Moon className="text-purple-400" size={20} />
        );
      }

      // 5. Lembrete de Datas (Exemplo fixo)
      if (now.getMonth() === 3 && now.getDate() === 22) { // 22 de Abril
         notifyHelo(
           "Data Especial! 🎈",
           "Hoje o portal celebra a sua vida e a da sua família. Que dia abençoado!",
           <Calendar className="text-red-500" size={20} />
         );
      }

      setLastCheck(today);
    };

    const notifyHelo = (title: string, msg: string, icon: React.ReactNode) => {
      toast(
        <div className="flex items-center gap-3">
          <div className="bg-amber-100 p-2 rounded-full">
            {icon}
          </div>
          <div>
            <p className="font-heading text-sm text-amber-900">{title}</p>
            <p className="text-[10px] text-muted-foreground leading-tight">{msg}</p>
          </div>
        </div>,
        { 
          duration: 10000,
          style: { border: '1px solid #fbbf24' }
        }
      );
    };

    // Rodar a lógica a cada hora para pegar os gatilhos de tempo
    runAgendaLogic();
    const interval = setInterval(runAgendaLogic, 1000 * 60 * 60);

    return () => clearInterval(interval);
  }, [user, isCarol, lastCheck]);

  return null;
}
