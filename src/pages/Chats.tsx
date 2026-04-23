import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { House } from "@/lib/store";
import MagicAdBanner from "@/components/MagicAdBanner";
import { 
  Lock, Zap, Coffee, Newspaper, MessageSquare, 
  Castle, Train, Sparkles, GraduationCap, Flame,
  Trophy, Shield, Ghost, LucideIcon
} from "lucide-react";
import MagicalEmoji from "@/components/MagicalEmoji";

interface RoomDefinition {
  name: string;
  description: string;
  category: string;
  allowed_houses: string[] | null;
  is_admin_only: boolean;
  icon: LucideIcon;
}

const ROOMS: RoomDefinition[] = [
  { name: "Chat Off", description: "Bate-papo fora do personagem.", category: "Geral", allowed_houses: null, is_admin_only: false, icon: Coffee },
  { name: "Eventos", description: "Avisos e cobertura de eventos do portal.", category: "Geral", allowed_houses: null, is_admin_only: false, icon: Sparkles },
  { name: "Profeta Diário", description: "Notícias do mundo bruxo.", category: "Geral", allowed_houses: null, is_admin_only: false, icon: Newspaper },
  
  { name: "Chat ON", description: "Conversas gerais dentro do RPG.", category: "RPG", allowed_houses: null, is_admin_only: false, icon: MessageSquare },
  { name: "Castelo RPG", description: "Exploração e interação pelo castelo de Hogwarts.", category: "RPG", allowed_houses: null, is_admin_only: false, icon: Castle },
  { name: "RPF Fora de Hogwarts", description: "Roleplay em Hogsmeade, Beco Diagonal, etc.", category: "RPG", allowed_houses: null, is_admin_only: false, icon: Train },
  { name: "Hogwarts Meet", description: "Encontros em vídeo mágicos! Reúna-se com outros bruxos em tempo real.", category: "RPG", allowed_houses: null, is_admin_only: false, icon: Zap },

  { name: "𝐅𝐢𝐜𝐡𝐚𝐬 𝐏𝐞𝐬𝐬𝐨𝐚𝐢𝐬 ₊ ෆ ˚", description: "Envie sua ficha pessoal aqui para o portal conhecer você!", category: "Fichas", allowed_houses: null, is_admin_only: false, icon: Sparkles },
  { name: "𝐅𝐢𝐜𝐡𝐚𝐬 𝐏𝐞𝐫𝐬𝐨𝐧𝐚𝐠𝐞𝐧𝐬 ₊ ෆ ˚", description: "Envie a ficha do seu personagem do RPG aqui.", category: "Fichas", allowed_houses: null, is_admin_only: false, icon: Zap },

  { name: "Comunal da Grifinória", description: "Acesso exclusivo aos corajosos da Grifinória.", category: "Comunais", allowed_houses: ["gryffindor"], is_admin_only: false, icon: Shield },
  { name: "Comunal da Sonserina", description: "Acesso exclusivo aos astutos da Sonserina.", category: "Comunais", allowed_houses: ["slytherin"], is_admin_only: false, icon: Shield },
  { name: "Comunal da Corvinal", description: "Acesso exclusivo aos sábios da Corvinal.", category: "Comunais", allowed_houses: ["ravenclaw"], is_admin_only: false, icon: Shield },
  { name: "Comunal da Lufa-Lufa", description: "Acesso exclusivo aos leais da Lufa-Lufa.", category: "Comunais", allowed_houses: ["hufflepuff"], is_admin_only: false, icon: Shield },

  { name: "Ordem da Fênix", description: "Reuniões da moderação e administração.", category: "Admin", allowed_houses: null, is_admin_only: true, icon: Flame },
];

export default function Chats() {
  const { profile, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [loadingRoom, setLoadingRoom] = useState<string | null>(null);
  const [channels, setChannels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    const { data } = await supabase.from("channels").select("*").order("name");
    if (data) setChannels(data);
    setLoading(false);
  };

  const handleEnterRoom = async (roomDef: any) => {
    if (roomDef.is_admin_only && !isAdmin) {
      toast.error("Acesso negado. Apenas membros da Ordem da Fênix podem entrar aqui.");
      return;
    }
    if (roomDef.allowed_houses && profile) {
      if (!roomDef.allowed_houses.includes(profile.house as House) && !isAdmin) {
        toast.error("Acesso negado. Esta não é a sua Sala Comunal.");
        return;
      }
    }
    // Check if room is disabled by admin
    if (roomDef.is_disabled && !isAdmin) {
      toast.error("Esta sala está temporariamente fechada pelos administradores.");
      return;
    }

    setLoadingRoom(roomDef.name);

    try {
      let roomId = roomDef.id;

      if (!roomId) {
        const { data: existingChannel } = await supabase.from("channels").select("id").eq("name", roomDef.name).maybeSingle();
        if (existingChannel) {
          roomId = existingChannel.id;
        } else {
          const { data: newChannel, error: insertError } = await supabase.from("channels").insert({
            name: roomDef.name,
            description: roomDef.description,
            category: roomDef.category,
            allowed_houses: roomDef.allowed_houses,
            is_admin_only: roomDef.is_admin_only,
          }).select("id").single();
          if (insertError) throw insertError;
          roomId = newChannel?.id;
        }
      }

      if (roomId) {
        navigate(`/dashboard/chat/${roomId}`);
      }
    } catch (err: any) {
      toast.error("Ocorreu um erro mágico ao tentar abrir as portas do salão: " + err.message);
    } finally {
      setLoadingRoom(null);
    }
  };

  const mergedRooms = ROOMS.map(room => {
    const dbRoom = channels.find(c => c.name === room.name);
    return {
      ...room,
      id: dbRoom?.id,
      is_premium: dbRoom?.is_premium || false,
      meet_link: dbRoom?.meet_link || null,
      is_disabled: dbRoom?.is_disabled || false,
    };
  });

  const categories = Array.from(new Set(mergedRooms.map((r) => r.category)));

  if (loading) return <div className="text-center py-20">Carregando salões...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">
      <div className="glass rounded-3xl p-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618944847823-72c1cce8a8e1?q=80&w=2070')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
        <div className="relative z-10">
          <h1 className="font-heading text-4xl md:text-5xl text-gold-gradient mb-3 drop-shadow-lg">Salões do Castelo</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Explore os corredores, salas comunais e espaços do castelo. Cada porta leva a uma nova aventura.
          </p>
        </div>
      </div>

      <MagicAdBanner />

      <div className="space-y-10">
        {categories.map((category) => (
          <div key={category}>
            <h2 className="font-heading text-xl text-primary mb-4 flex items-center gap-2">
              <span className="w-8 h-[1px] bg-primary/30"></span>
              {category}
              <span className="flex-1 h-[1px] bg-primary/10"></span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mergedRooms.filter((r) => r.category === category).map((room) => {
                const isLocked = (room.is_admin_only && !isAdmin) || 
                                 (room.allowed_houses && profile && !room.allowed_houses.includes(profile.house as House) && !isAdmin);
                const isDisabled = room.is_disabled && !isAdmin;
                
                return (
                  <div 
                    key={room.name}
                    onClick={() => !isLocked && !isDisabled && handleEnterRoom(room)}
                    className={`relative glass rounded-2xl p-5 border transition-all duration-300
                      ${isLocked || isDisabled ? "opacity-60 cursor-not-allowed grayscale-[30%] border-border/50" : 
                        room.is_premium ? "border-primary/80 shadow-[0_0_15px_rgba(212,175,55,0.4)] hover:shadow-[0_0_25px_rgba(212,175,55,0.6)] cursor-pointer group bg-primary/5" : 
                        "border-border/50 hover:border-primary/50 hover:shadow-[0_0_20px_rgba(212,175,55,0.15)] hover:-translate-y-1 cursor-pointer group"}
                    `}
                  >
                    {room.is_premium && (
                      <div className="absolute -top-2 -right-2 text-2xl animate-bounce">✨</div>
                    )}
                    {isDisabled && (
                      <div className="absolute top-2 right-2 bg-destructive/20 text-destructive text-[10px] px-2 py-1 rounded-full font-heading flex items-center gap-1">
                        <Lock size={10} /> Fechada
                      </div>
                    )}
                    {room.name === "Hogwarts Meet" && !isDisabled && (
                      <div className="absolute top-2 right-2 bg-primary/20 text-primary text-[10px] px-2 py-1 rounded-full font-heading flex items-center gap-1 animate-pulse">
                        <Zap size={10} /> Novo!
                      </div>
                    )}
                    <div className="flex justify-between items-start mb-6">
                      <MagicalEmoji 
                        icon={room.icon} 
                        size="sm" 
                        glowColor={room.is_premium ? "rgba(234, 179, 8, 0.4)" : "rgba(255, 255, 255, 0.1)"}
                        className={isLocked ? "opacity-40" : ""}
                      />
                      {isLocked && <div className="text-xl text-muted-foreground bg-black/40 p-2 rounded-full border border-white/5" title="Acesso Negado">🔒</div>}
                    </div>
                    
                    <h3 className={`font-heading text-lg mb-1 transition-colors ${room.is_premium ? 'text-primary drop-shadow-md' : 'text-foreground group-hover:text-primary'}`}>
                      {room.name}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                      {room.description}
                    </p>

                    {loadingRoom === room.name && (
                      <div className="absolute inset-0 bg-background/80 rounded-2xl flex items-center justify-center backdrop-blur-sm z-10">
                        <span className="text-2xl animate-pulse">✨</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
