import { useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

const MESSAGES = [
  "🧹 Filch está limpando os corredores... melhor não fazer bagunça!",
  "🦉 Uma coruja acabou de passar com o Profeta Diário.",
  "✨ A magia está forte hoje! Complete uma missão para ganhar mais XP.",
  "🏰 O Chapéu Seletor tem sussurrado coisas estranhas...",
  "🏆 Lembre-se: Cada ponto conta para a Taça das Casas!",
  "🧙‍♂️ Dumbledore sempre diz: 'A felicidade pode ser encontrada mesmo nas horas mais sombrias.'",
  "⚡ Não se esqueça de olhar a aba de Missões!",
  "🔮 A Professora Trelawney previu que você ganhará muito XP hoje.",
];

export default function EngagementBot() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Show a random message every 3-5 minutes
    const interval = setInterval(() => {
      const msg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
      toast(msg, {
        icon: "🤖",
        className: "bg-primary/20 border-primary/30 text-primary-foreground",
        duration: 5000,
      });
    }, Math.random() * 120000 + 180000); // 3 to 5 minutes

    return () => clearInterval(interval);
  }, [user]);

  return null;
}
