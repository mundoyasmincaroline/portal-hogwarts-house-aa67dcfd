import { useEffect, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RefreshCw, Check, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { HOUSES, type House } from "@/types";
import { useCharacters } from "@/hooks/features/useCharacters";

export default function TurnSwitcher() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { characters, loading, switchingId, loadCharacters, switchCharacter, activeId } = useCharacters();

  useEffect(() => { 
    if (open) loadCharacters(); 
  }, [open, loadCharacters]);

  const handleSwitch = async (charId: string) => {
    await switchCharacter(charId);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="touch-target w-9 h-9 text-muted-foreground hover:bg-primary/10 hover:text-primary rounded-xl transition-all active:scale-90"
          title="Trocar Personagem"
        >
          <RefreshCw size={16} className={switchingId ? "animate-spin" : "transition-transform group-hover:rotate-180 duration-700"} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 bg-card border-primary/20 shadow-[0_20px_50px_rgba(0,0,0,0.8)] rounded-[2rem] overflow-hidden backdrop-blur-2xl">

        <div className="px-2 py-2 mb-1 border-b border-border/40">
          <p className="text-[10px] font-heading uppercase tracking-[0.2em] text-primary">Botão de Giro</p>
          <p className="text-xs text-muted-foreground italic">Quem você será neste turno?</p>
        </div>

        {loading ? (
          <div className="p-4 text-center text-xs text-muted-foreground">Lendo registros…</div>
        ) : (
          <div className="space-y-1 max-h-72 overflow-y-auto">
            {characters.map((c) => {
              const isActive = c.id === activeId;
              const houseInfo = c.house ? HOUSES[c.house as House] : null;
              return (
                <button
                  key={c.id}
                  onClick={() => handleSwitch(c.id)}
                  disabled={!!switchingId}
                  className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg transition-colors text-left ${
                    isActive ? "bg-primary/10 border border-primary/30" : "hover:bg-secondary/60 border border-transparent"
                  }`}
                >
                  <div className="w-9 h-9 rounded-full overflow-hidden bg-secondary shrink-0 border border-border/40">
                    {c.avatar_url ? (
                      <img src={c.avatar_url} alt={c.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-base">🧙</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-heading truncate text-foreground">{c.full_name}</p>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground truncate">
                      {c.character_type === "canon" ? "Canon" : "OC"} · {houseInfo?.name ?? "Sem Casa"} · Nv {c.level ?? 1}
                    </p>
                  </div>
                  {isActive && <Check size={14} className="text-primary shrink-0" />}
                </button>
              );
            })}

            {characters.length < 2 && (
              <button
                onClick={() => { setOpen(false); navigate("/dashboard/profile"); }}
                className="w-full flex items-center gap-3 px-2 py-2 rounded-lg border border-dashed border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  <Plus size={14} className="text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-heading text-foreground">Nova Ficha</p>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Crie outro personagem</p>
                </div>
              </button>
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}