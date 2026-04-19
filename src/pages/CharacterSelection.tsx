import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import MagicalParticles from "@/components/MagicalParticles";
import { toast } from "sonner";
import CharacterCreation from "./CharacterCreation";

export default function CharacterSelection() {
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

    // Se não tiver nenhum personagem, força a criação
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

  if (showCreation) {
    return <CharacterCreation onComplete={fetchCharacters} onCancel={() => characters.length > 0 ? setShowCreation(false) : null} canCancel={characters.length > 0} />;
  }

  return (
    <div className="relative min-h-screen p-4 flex flex-col items-center justify-center">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-0" />
      <MagicalParticles />
      
      <div className="relative z-10 max-w-4xl w-full">
        <div className="text-center mb-8">
          <h1 className="font-heading text-4xl text-gold-gradient mb-2">Quem você será hoje?</h1>
          <p className="text-muted-foreground">Escolha qual personagem vai assumir neste turno ou crie um novo.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {characters.map(char => (
            <div key={char.id} className="glass p-6 rounded-2xl border border-border/50 text-center hover:border-primary/50 transition-colors">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-2 border-primary/20">
                {char.avatar_url ? (
                  <img src={char.avatar_url} alt={char.full_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-secondary flex items-center justify-center text-2xl">🧙</div>
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
          <div 
            onClick={() => setShowCreation(true)}
            className="glass p-6 rounded-2xl border border-dashed border-border/50 text-center flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all min-h-[300px]"
          >
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-2xl mb-4">
              ✨
            </div>
            <h3 className="font-heading text-lg text-foreground">Nova Ficha</h3>
            <p className="text-xs text-muted-foreground">Criar um novo personagem para a sua conta.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
