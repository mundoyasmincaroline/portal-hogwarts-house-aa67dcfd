import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { House } from "@/types";
import MagicAdBanner from "@/components/MagicAdBanner";
import EmojiIcon from "@/components/shared/EmojiIcon";
import { 
  Lock, Zap, Coffee, Newspaper, MessageSquare, 
  Castle, Train, Sparkles, GraduationCap, Flame,
  Trophy, Shield, Ghost, LucideIcon
} from "lucide-react";
import MagicalEmoji from "@/components/shared/MagicalEmoji";

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
  const [searchQuery, setSearchQuery] = useState("");

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
        // Double check by name if ID was missing from props (mergedRooms)
        const { data: existingChannel } = await supabase
          .from("channels")
          .select("id")
          .eq("name", roomDef.name)
          .maybeSingle();
        
        if (existingChannel) {
          roomId = existingChannel.id;
        } else if (isAdmin) {
          // Automatic room creation only for admins to prevent race conditions or messy DB
          const { data: newChannel, error: insertError } = await supabase.from("channels").insert({
            name: roomDef.name,
            description: roomDef.description,
            category: roomDef.category,
            allowed_houses: roomDef.allowed_houses,
            is_admin_only: roomDef.is_admin_only,
          }).select("id").single();
          if (insertError) throw insertError;
          roomId = newChannel?.id;
        } else {
          throw new Error("Sala não inicializada. Peça a um administrador para abrir este salão.");
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
    <div className="max-w-6xl mx-auto space-y-8 sm:space-y-12 pb-20 px-4 sm:px-6">
      <div className="glass rounded-[2rem] sm:rounded-[3rem] p-8 sm:p-12 text-center relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-primary/20 group">
        <div className="absolute inset-0 bg-[url('/hogwarts-castle-bg.jpg')] bg-cover bg-center opacity-10 group-hover:scale-105 transition-transform duration-1000 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-black/40"></div>
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 border border-primary/30 mb-2 animate-float">
            <Castle size={40} className="text-primary drop-shadow-[0_0_10px_rgba(212,175,55,0.5)]" />
          </div>
          <h1 className="font-heading text-5xl md:text-7xl text-gold-gradient mb-2 drop-shadow-2xl tracking-tighter">Salões do Castelo</h1>
          <p className="text-muted-foreground/80 text-sm sm:text-lg max-w-2xl mx-auto font-serif italic">
            "Não é apenas um castelo, é o nosso lar. Explore cada corredor, desvende cada segredo e escreva sua própria história."
          </p>
          <div className="flex items-center justify-center gap-2 pt-4">
            <span className="h-px w-12 bg-primary/30"></span>
            <span className="text-[10px] uppercase tracking-[0.4em] text-primary/60 font-bold">Hogwarts House</span>
            <span className="h-px w-12 bg-primary/30"></span>
          </div>
        </div>
      </div>

      <MagicAdBanner />

      <div className="relative group mb-8">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <EmojiIcon e="🔍" />
        </div>
        <input 
          type="text"
          placeholder="Buscar salão pelo nome..."
          className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all placeholder:text-muted-foreground/50"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="space-y-10">
        {categories.map((category) => (
          <div key={category}>
            <h2 className="font-heading text-xl text-primary mb-4 flex items-center gap-2 relative">
              <span className="w-8 h-[1px] bg-primary/30"></span>
              <span className="relative">
                {category}
                <motion.span 
                  animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -top-1 -right-4 text-[10px]"
                >✨</motion.span>
              </span>
              <span className="flex-1 h-[1px] bg-primary/10"></span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mergedRooms
                .filter((r) => r.category === category && r.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((room) => {
                const isLocked = (room.is_admin_only && !isAdmin) || 
                                 (room.allowed_houses && profile && !room.allowed_houses.includes(profile.house as House) && !isAdmin);
                const isDisabled = room.is_disabled && !isAdmin;
                
                return (
                  <div 
                    key={room.name}
                    onClick={() => !isLocked && !isDisabled && handleEnterRoom(room)}
                    className={`relative glass rounded-[2rem] p-6 border transition-all duration-500
                      ${isLocked || isDisabled ? "opacity-60 cursor-not-allowed grayscale-[30%] border-border/50" : 
                        room.is_premium ? "border-primary/80 shadow-[0_0_25px_rgba(212,175,55,0.3)] hover:shadow-[0_0_40px_rgba(212,175,55,0.5)] cursor-pointer group bg-primary/10 -translate-y-1" : 
                        "border-white/5 hover:border-primary/40 hover:shadow-[0_15px_30px_rgba(0,0,0,0.4)] hover:-translate-y-2 cursor-pointer group bg-white/5"}
                    `}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[2rem]" />
                    
                    {room.is_premium && (
                      <div className="absolute -top-3 -right-3 w-12 h-12 flex items-center justify-center text-3xl animate-bounce drop-shadow-[0_0_10px_rgba(234,179,8,0.6)]"><EmojiIcon e="✨" /></div>
                    )}
                    
                    {isDisabled && (
                      <div className="absolute top-4 right-4 bg-destructive/20 text-destructive text-[10px] px-3 py-1 rounded-full font-heading flex items-center gap-1.5 backdrop-blur-md border border-destructive/30">
                        <Lock size={12} /> FECHADA
                      </div>
                    )}

                    <div className="flex justify-between items-start mb-8 relative z-10">
                      <div className={`p-4 rounded-2xl bg-white/5 border border-white/10 group-hover:border-primary/40 group-hover:bg-primary/5 transition-all duration-500 transform group-hover:rotate-6 ${isLocked ? "opacity-40" : ""}`}>
                        <room.icon size={28} className={`transition-colors duration-500 ${room.is_premium ? "text-primary" : "text-muted-foreground group-hover:text-primary"}`} />
                      </div>
                      {isLocked && (
                        <div className="w-10 h-10 flex items-center justify-center text-xl text-muted-foreground bg-black/60 rounded-xl border border-white/10 shadow-inner" title="Acesso Negado">
                          <EmojiIcon e="🔒" />
                        </div>
                      )}
                    </div>
                    
                    <div className="relative z-10">
                      <h3 className={`font-heading text-xl mb-2 transition-colors duration-500 ${room.is_premium ? 'text-primary drop-shadow-md' : 'text-foreground group-hover:text-primary'}`}>
                        {room.name}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 font-body group-hover:text-foreground/80 transition-colors">
                        {room.description}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <span className="text-[9px] uppercase tracking-widest text-muted-foreground/40 font-bold group-hover:text-primary/40 transition-colors">
                          {Math.floor(Math.random() * 12) + 1} Bruxos
                        </span>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-500">
                        <Zap size={14} className="text-primary" />
                      </div>
                    </div>

                    {loadingRoom === room.name && (
                      <div className="absolute inset-0 bg-background/90 rounded-[2rem] flex flex-col items-center justify-center backdrop-blur-md z-50 animate-in fade-in duration-300">
                        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-3"></div>
                        <p className="text-[10px] font-heading text-primary uppercase tracking-[0.2em] animate-pulse">Abrindo Portais...</p>
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
