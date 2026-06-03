import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import MagicalParticles from "@/components/MagicalParticles";
import { toast } from "sonner";
import CharacterCreation from "./CharacterCreation";

import EmojiIcon from "@/components/shared/EmojiIcon";
interface Props {
  adminMode?: boolean;
}

export default function CharacterSelection({ adminMode }: Props) {
  const { user, profile } = useAuth();
  const [characters, setCharacters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreation, setShowCreation] = useState(false);
  const [selecting, setSelecting] = useState<string | null>(null);


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
    setSelecting(charId);
    const { error } = await supabase
      .from("profiles")
      .update({ active_character_id: charId } as any)
      .eq("user_id", user?.id);

    if (error) {
      toast.error("Erro ao assumir o personagem.");
      setSelecting(null);
    } else {
      useAuth.setState((state) => ({
        profile: state.profile ? { ...state.profile, active_character_id: charId } : null
      }));
      toast.success("Personagem assumido com sucesso! ✨");
      // Pequeno delay para garantir sincronia do estado
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  };


  if (loading) return <div className="h-dvh flex items-center justify-center">Lendo registros mágicos...</div>;

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
    <div className="relative min-h-screen p-6 flex flex-col items-center justify-center bg-black/40">
      <div className="absolute inset-0 bg-background/50 backdrop-blur-xl z-0" />
      <MagicalParticles />

      {selecting && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/80 backdrop-blur-md">
          <div className="w-20 h-20 rounded-full border-t-2 border-primary animate-spin mb-4" />
          <p className="font-heading text-xl text-gold-gradient animate-pulse">Entrando no castelo...</p>
        </div>
      )}

      
      <div className="relative z-10 max-w-4xl w-full">
        <div className="text-center mb-6 sm:mb-8 px-2">
          <h1 className="font-heading text-4xl sm:text-6xl text-gold-gradient mb-4 drop-shadow-[0_10px_30px_rgba(212,175,55,0.4)] tracking-tighter">Quem você será hoje?</h1>
          <p className="text-muted-foreground text-base sm:text-lg font-serif italic">"Não são nossas habilidades que mostram o que somos, mas nossas escolhas."</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {characters.map(char => (
            <div key={char.id} className="glass p-8 rounded-[2.5rem] border-primary/20 text-center hover:border-primary/60 transition-all hover:scale-[1.03] shadow-2xl">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-2 border-primary/20">
                {char.avatar_url ? (
                  <img src={char.avatar_url} alt={char.full_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-secondary flex items-center justify-center text-2xl"><EmojiIcon e="🧙" /></div>
                )}
              </div>
              <h3 className="font-heading text-xl text-foreground mb-1">{char.full_name}</h3>
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-4">
                {char.character_type === 'oc' ? 'Original (OC)' : 'Saga (Canon)'} • {char.house || 'Sem Casa'}
              </p>
              
              <div className="flex justify-between text-xs text-muted-foreground mb-4 px-4">
                <span>Nível {char.level}</span>
                <span>{char.xp} XP</span>
              </div>

              <Button variant="magical" className="w-full" onClick={() => selectCharacter(char.id)}>
                Assumir Turno
              </Button>
            </div>
          ))}

          {/* Botão de Criar Novo */}
          {characters.length < 2 && (
            <div 
              onClick={() => setShowCreation(true)}
              className="glass p-8 rounded-[2.5rem] border border-dashed border-primary/20 text-center flex flex-col items-center justify-center cursor-pointer hover:border-primary/60 hover:bg-primary/5 transition-all min-h-[350px] shadow-2xl hover:scale-[1.03]"
            >
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-2xl mb-4">
                <EmojiIcon e="✨" />
              </div>
              <h3 className="font-heading text-lg text-foreground">Nova Ficha</h3>
              <p className="text-xs text-muted-foreground">Criar um novo personagem para a sua conta.</p>
            </div>
          )}
        </div>

        {/* Admin skip button */}
        {adminMode && (
          <div className="text-center mt-4">
            <button
              onClick={handleAdminSkip}
              className="text-xs text-muted-foreground hover:text-primary underline underline-offset-2 transition-colors"
            >
              <EmojiIcon e="⚙️" /> Admin: pular seleção de personagem por agora
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
