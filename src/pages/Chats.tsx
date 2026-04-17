import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { House } from "@/lib/store";

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
    // Validação local de acesso
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

    setLoadingRoom(roomDef.name);

    try {
      if (roomDef.id) {
        navigate(`/dashboard/chat/${roomDef.id}`);
        return;
      }
    } catch (err: any) {
      toast.error("Ocorreu um erro mágico ao tentar abrir as portas do salão: " + err.message);
    } finally {
      setLoadingRoom(null);
    }
  };

  const categories = Array.from(new Set(channels.map((r) => r.category)));

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

      <div className="space-y-10">
        {categories.map((category) => (
          <div key={category}>
            <h2 className="font-heading text-xl text-primary mb-4 flex items-center gap-2">
              <span className="w-8 h-[1px] bg-primary/30"></span>
              {category}
              <span className="flex-1 h-[1px] bg-primary/10"></span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {channels.filter((r) => r.category === category).map((room) => {
                const isLocked = (room.is_admin_only && !isAdmin) || 
                                 (room.allowed_houses && profile && !room.allowed_houses.includes(profile.house as House) && !isAdmin);
                
                return (
                  <div 
                    key={room.name}
                    onClick={() => !isLocked && handleEnterRoom(room)}
                    className={`relative glass rounded-2xl p-5 border transition-all duration-300
                      ${isLocked ? "opacity-60 cursor-not-allowed grayscale-[30%] border-border/50" : 
                        room.is_premium ? "border-primary/80 shadow-[0_0_15px_rgba(212,175,55,0.4)] hover:shadow-[0_0_25px_rgba(212,175,55,0.6)] cursor-pointer group bg-primary/5" : 
                        "border-border/50 hover:border-primary/50 hover:shadow-[0_0_20px_rgba(212,175,55,0.15)] hover:-translate-y-1 cursor-pointer group"}
                    `}
                  >
                    {room.is_premium && (
                      <div className="absolute -top-2 -right-2 text-2xl animate-bounce">✨</div>
                    )}
                    <div className="flex justify-between items-start mb-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition-transform ${room.is_premium ? 'bg-primary/20 ring-2 ring-primary/50 text-primary' : 'bg-secondary/50'}`}>
                        {room.name[0]}
                      </div>
                      {isLocked && <div className="text-xl text-muted-foreground" title="Acesso Negado">🔒</div>}
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
