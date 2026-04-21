import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import MagicalParticles from "@/components/MagicalParticles";
import { toast } from "sonner";
import CharacterCreation from "./CharacterCreation";

interface Props {
  adminMode?: boolean;
}

export default function CharacterSelection({ adminMode }: Props) {
  const { user, profile } = useAuth();
  const [characters, setCharacters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreation, setShowCreation] = useState(false);

  useEffect(() => {
    fetchCharacters();
  }, []);

  const fetchCharacters = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("characters")
      .select("*")
      .eq("user_id", user.id);
    
    if (data) setCharacters(data);
    setLoading(false);

    // Se não tiver nenhum personagem, força a criação (mas admin pode cancelar)
    if (data && data.length === 0) {
      setShowCreation(true);
    }
  };

  const selectCharacter = async (charId: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ active_character_id: charId } as never)
      .eq("user_id", user?.id);

    if (error) {
      toast.error("Erro ao assumir o personagem.");
    } else {
      useAuth.setState((state) => ({
        profile: state.profile ? { ...state.profile, active_character_id: charId } : null
      }));
      toast.success("Personagem assumido com sucesso! ✨");
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center">Lendo registros mágicos...</div>;

  // Admin can skip character creation entirely via a bypass flag
  const handleAdminSkip = async () => {
    // Pick first character if exists, otherwise set a sentinel in localStorage
    if (characters.length > 0) {
      await selectCharacter(characters[0].id);
    } else {
      // Mark that admin deliberately chose to skip for now
      localStorage.setItem(`admin_skip_character_${user?.id}`, "true");
      // Force reload to bypass the CharacterSelection gate
      window.location.reload();
    }
  };

  if (showCreation) {
    return <CharacterCreation onComplete={fetchCharacters} onCancel={() => adminMode ? setShowCreation(false) : characters.length > 0 ? setShowCreation(false) : null} canCancel={adminMode || characters.length > 0} />;
  }

  return (
    <div className="relative min-h-screen p-4 md:p-12 flex flex-col items-center justify-center overflow-hidden">
      {/* Background Magic Layer */}
      <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-2xl" />
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px]" />
      </div>

      <MagicalParticles />
      
      <div className="relative z-10 w-full max-w-6xl">
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-heading text-primary uppercase tracking-[0.3em]">
            <Sparkles size={10} className="animate-spin-slow" /> Escolha sua Identidade
          </div>
          <h1 className="text-5xl md:text-7xl font-heading text-gold-gradient tracking-tight drop-shadow-2xl">Quem você será hoje?</h1>
          <p className="text-muted-foreground font-serif italic text-lg max-w-2xl mx-auto opacity-70">
            "Não são nossas habilidades que mostram quem realmente somos, mas sim nossas escolhas."
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {characters.map(char => (
            <div key={char.id} className="relative group/card cursor-pointer" onClick={() => selectCharacter(char.id)}>
              <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-b from-white/[0.08] to-black/60 backdrop-blur-2xl p-8 border border-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.8)] transition-all duration-500 hover:-translate-y-4 hover:border-primary/50 group-hover/card:shadow-primary/20 h-full flex flex-col items-center">
                
                {/* 3D Aura Glow */}
                <div className={`absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-20 group-hover/card:opacity-40 transition-opacity ${
                   char.house === 'Sonserina' ? 'bg-green-500' : 
                   char.house === 'Grifinória' ? 'bg-red-500' :
                   char.house === 'Corvinal' ? 'bg-blue-500' : 'bg-yellow-500'
                }`} />

                <div className="relative w-40 h-40 mb-8">
                  {/* Portrait Frame */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-transparent rounded-[2rem] p-1 shadow-2xl rotate-3 group-hover/card:rotate-0 transition-transform duration-500">
                     <div className="w-full h-full rounded-[1.8rem] overflow-hidden border-2 border-white/10 bg-black/40">
                        {char.avatar_url ? (
                          <img src={char.avatar_url} alt={char.full_name} className="w-full h-full object-cover scale-110 group-hover/card:scale-100 transition-transform duration-700" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-5xl bg-gradient-to-br from-slate-800 to-slate-900">🧙</div>
                        )}
                     </div>
                  </div>
                  {/* Shimmer overlay */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent pointer-events-none rounded-[2rem] rotate-3 group-hover/card:rotate-0 transition-transform duration-500" />
                </div>

                <div className="text-center space-y-2 mb-6">
                  <h3 className="font-heading text-2xl text-white tracking-tight group-hover/card:text-gold-gradient transition-colors">{char.full_name}</h3>
                  <div className="flex items-center justify-center gap-2">
                     <span className="text-[10px] font-heading text-primary/60 uppercase tracking-widest">{char.character_type === 'oc' ? 'Original' : 'Canon'}</span>
                     <div className="w-1 h-1 bg-white/20 rounded-full" />
                     <span className="text-[10px] font-heading text-white/60 uppercase tracking-widest">{char.house || 'Sem Casa'}</span>
                  </div>
                </div>
                
                <div className="w-full grid grid-cols-2 gap-4 mb-8 bg-white/[0.03] rounded-2xl p-4 border border-white/5 shadow-inner">
                   <div className="text-center border-r border-white/5">
                      <p className="text-[9px] text-white/40 uppercase font-heading tracking-widest">Nível</p>
                      <p className="text-lg font-heading text-white">{char.level}</p>
                   </div>
                   <div className="text-center">
                      <p className="text-[9px] text-white/40 uppercase font-heading tracking-widest">XP Total</p>
                      <p className="text-lg font-heading text-white">{char.xp}</p>
                   </div>
                </div>

                <button 
                  onClick={(e) => { e.stopPropagation(); selectCharacter(char.id); }}
                  className="w-full py-4 rounded-2xl bg-primary text-white font-heading tracking-[0.2em] shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all hover:scale-105 active:scale-95"
                >
                  ASSUMIR TURNO
                </button>
              </div>
            </div>
          ))}

          {/* New Character Card */}
          {characters.length < 2 && (
            <div 
              onClick={() => setShowCreation(true)}
              className="relative group/new h-full"
            >
              <div className="h-full relative overflow-hidden rounded-[2.5rem] bg-white/[0.02] backdrop-blur-2xl p-8 border border-dashed border-white/20 flex flex-col items-center justify-center gap-6 cursor-pointer hover:bg-primary/5 hover:border-primary/50 transition-all duration-500 hover:-translate-y-2">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-4xl border border-primary/20 group-hover/new:scale-110 group-hover/new:bg-primary/20 transition-all">
                  ✨
                </div>
                <div className="text-center">
                  <h3 className="font-heading text-2xl text-white/60 group-hover/new:text-white transition-colors">Nova Ficha</h3>
                  <p className="text-xs text-white/30 font-serif italic mt-2">Um novo destino aguarda por você...</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Admin controls */}
        {adminMode && (
          <div className="text-center">
            <button
              onClick={handleAdminSkip}
              className="px-6 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-heading text-white/40 uppercase tracking-[0.3em] hover:text-primary hover:border-primary/40 transition-all"
            >
              ⚙️ Pular Seleção (Modo Admin)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
