import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Beaker, Flame, Sparkles, Plus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import SafeImage from "./SafeImage";

export default function AlchemyTable() {
  const { user, profile, fetchProfile } = useAuth();
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [isCrafting, setIsCrafting] = useState(false);

  // Mock de receitas (no futuro pode vir do DB)
  const RECIPES = [
    { 
        ingredients: ["Pena de Fênix", "Frasco de Vidro"], 
        result: { name: "Poção de XP Dobrado", description: "Dobra seu XP por 1 hora.", xp_bonus: 500 } 
    }
  ];

  const handleCraft = async () => {
    if (selectedItems.length < 2) return toast.error("Selecione pelo menos 2 ingredientes!");
    
    setIsCrafting(true);
    // Simular tempo de preparo
    setTimeout(async () => {
        toast.success("✨ Poção preparada com sucesso! Você ganhou +500 XP bônus.");
        await supabase.rpc("award_xp_action", { _action: "crafting", _user_id: user?.id, _xp: 500 });
        fetchProfile(user?.id);
        setSelectedItems([]);
        setIsCrafting(false);
    }, 2000);
  };

  return (
    <div className="glass rounded-[3rem] p-10 border border-primary/30 max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
            <div className="p-4 bg-primary/20 rounded-2xl text-primary">
                <Beaker size={32} />
            </div>
            <div>
                <h2 className="text-3xl font-heading text-white">Laboratório de Alquimia</h2>
                <p className="text-sm text-muted-foreground">Combine ingredientes raros para criar poções poderosas.</p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Caldeirão */}
            <div className="relative flex flex-col items-center">
                <div className={`w-64 h-64 rounded-full border-8 border-[#3d2b1f] bg-indigo-950/40 relative flex items-center justify-center ${isCrafting ? "animate-pulse" : ""}`}>
                    <div className="absolute inset-4 rounded-full border-4 border-primary/20 animate-spin-slow" />
                    
                    {selectedItems.length === 0 ? (
                        <Plus size={48} className="text-muted-foreground opacity-20" />
                    ) : (
                        <div className="flex -space-x-4">
                            {selectedItems.map((item, i) => (
                                <div key={i} className="w-20 h-20 rounded-full border-2 border-primary bg-background overflow-hidden animate-bounce" style={{ animationDelay: `${i * 0.2}s` }}>
                                    <SafeImage src={item.image_url} fallbackEmoji="🧪" />
                                </div>
                            ))}
                        </div>
                    )}

                    {isCrafting && (
                        <div className="absolute -bottom-4 text-primary animate-bounce">
                            <Flame size={40} />
                        </div>
                    )}
                </div>
                
                <Button 
                    variant="magical" 
                    className="mt-10 px-12 py-7 rounded-2xl text-lg shadow-[0_0_20px_rgba(var(--primary-rgb),0.4)]"
                    disabled={selectedItems.length < 2 || isCrafting}
                    onClick={handleCraft}
                >
                    {isCrafting ? "Preparando..." : "Acender Caldeirão 🔥"}
                </Button>
            </div>

            {/* Inventário para seleção */}
            <div className="space-y-4">
                <h4 className="text-xs font-heading text-primary uppercase tracking-widest">Seus Ingredientes:</h4>
                <div className="grid grid-cols-3 gap-3">
                    {[1, 2, 3].map(i => (
                        <button 
                            key={i}
                            onClick={() => {
                                if (selectedItems.length < 3) setSelectedItems([...selectedItems, { id: i, image_url: null }]);
                            }}
                            className="aspect-square glass rounded-2xl border border-border/50 hover:border-primary transition-all flex items-center justify-center"
                        >
                            <Beaker size={24} className="opacity-40" />
                        </button>
                    ))}
                </div>
                <div className="p-4 bg-secondary/30 rounded-xl border border-border italic text-[11px] text-muted-foreground">
                    "Misture Ervas da Estufa com Muco de Verme para uma poção básica de cura."
                </div>
            </div>
        </div>
    </div>
  );
}
