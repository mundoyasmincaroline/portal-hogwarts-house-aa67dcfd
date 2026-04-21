/**
 * StickerVisual — arte gerada em código para figurinhas do álbum
 * Detecta tema pelo nome e renderiza arte SVG única por raridade
 */

type Rarity = "bronze" | "silver" | "gold";

function detect(name: string) {
  const n = name.toLowerCase();
  if (n.includes("grifin") || n.includes("gryffin") || n.includes("leão") || n.includes("lion")) return "gryffindor";
  if (n.includes("sonser") || n.includes("slyther") || n.includes("serp") || n.includes("snake")) return "slytherin";
  if (n.includes("corvin") || n.includes("raven") || n.includes("águia")) return "ravenclaw";
  if (n.includes("lufa") || n.includes("hufflep") || n.includes("texugo")) return "hufflepuff";
  if (n.includes("vassoura") || n.includes("nimbus") || n.includes("firebolt") || n.includes("saeta")) return "broom";
  if (n.includes("varinha") || n.includes("wand") || n.includes("bacinha")) return "wand";
  if (n.includes("coruja") || n.includes("edwiges") || n.includes("owl")) return "owl";
  if (n.includes("dragão") || n.includes("dragon")) return "dragon";
  if (n.includes("pomo") || n.includes("snitch")) return "snitch";
  if (n.includes("caldeirão") || n.includes("poção") || n.includes("cauldron")) return "cauldron";
  if (n.includes("mapa") || n.includes("maroto")) return "map";
  if (n.includes("chapéu") || n.includes("sorting") || n.includes("hat")) return "hat";
  if (n.includes("troll") || n.includes("dement") || n.includes("basilisco") || n.includes("werewolf")) return "creature";
  return "wizard";
}

const RARITY_STYLE: Record<Rarity, { border: string; glow: string; bg: string; shine: string }> = {
  bronze: { border: "#92400e", glow: "rgba(180,83,9,0.5)", bg: "from-amber-950 via-amber-900/60 to-stone-950", shine: "#D97706" },
  silver: { border: "#94a3b8", glow: "rgba(148,163,184,0.4)", bg: "from-slate-800 via-slate-700/60 to-slate-900", shine: "#CBD5E1" },
  gold:   { border: "#FBBF24", glow: "rgba(251,191,36,0.6)", bg: "from-yellow-900 via-amber-800/60 to-stone-950", shine: "#FDE68A" },
};

const THEME_MAP: Record<string, { emoji: string; color: string; label: string }> = {
  gryffindor: { emoji: "🦁", color: "#EF4444", label: "Grifinória" },
  slytherin:  { emoji: "🐍", color: "#10B981", label: "Sonserina" },
  ravenclaw:  { emoji: "🦅", color: "#60A5FA", label: "Corvinal" },
  hufflepuff: { emoji: "🦡", color: "#FBBF24", label: "Lufa-Lufa" },
  broom:      { emoji: "🧹", color: "#F59E0B", label: "Vassoura" },
  wand:       { emoji: "🪄", color: "#A855F7", label: "Varinha" },
  owl:        { emoji: "🦉", color: "#94a3b8", label: "Coruja" },
  dragon:     { emoji: "🐉", color: "#EF4444", label: "Dragão" },
  snitch:     { emoji: "✨", color: "#FBBF24", label: "Pomo" },
  cauldron:   { emoji: "🧪", color: "#6EE7B7", label: "Caldeirão" },
  map:        { emoji: "🗺️", color: "#C084FC", label: "Mapa" },
  hat:        { emoji: "🎩", color: "#a16207", label: "Chapéu" },
  creature:   { emoji: "👁️", color: "#7C3AED", label: "Criatura" },
  wizard:     { emoji: "🧙", color: "#818CF8", label: "Mago(a)" },
};

interface Props {
  name: string;
  rarity: Rarity;
  unlocked: boolean;
  imageUrl?: string | null;
  failedImage?: boolean;
}

export default function StickerVisual({ name, rarity, unlocked, imageUrl, failedImage }: Props) {
  const style = RARITY_STYLE[rarity];
  const theme = THEME_MAP[detect(name)] || THEME_MAP.wizard;

  // Se tem imagem real e carregou
  if (imageUrl && !failedImage) return null;

  const particles = Array.from({ length: 12 }, (_, i) => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 1,
    delay: Math.random() * 5,
    duration: Math.random() * 3 + 2,
  }));

  return (
    <div className={`absolute inset-0 bg-gradient-to-br ${style.bg} flex items-center justify-center overflow-hidden group/sticker-content`}>
      {/* MONSTER QUALITY BACKGROUND PATTERN */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/papyros.png')] opacity-10 mix-blend-overlay pointer-events-none" />
      
      {/* PREMIUM PARTICLES */}
      {unlocked && particles.map((p, i) => (
        <div 
          key={i} 
          className="absolute rounded-full animate-pulse pointer-events-none"
          style={{ 
            left: `${p.x}%`, 
            top: `${p.y}%`, 
            width: p.size, 
            height: p.size,
            background: i % 2 === 0 ? style.shine : theme.color,
            opacity: 0.4,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            boxShadow: `0 0 10px ${style.shine}`
          }} 
        />
      ))}

      {/* AAA AURA GLOW */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div 
          className="w-48 h-48 rounded-full blur-[60px] opacity-20 animate-pulse transition-all duration-1000 group-hover/sticker-content:scale-150 group-hover/sticker-content:opacity-40"
          style={{ background: `radial-gradient(circle, ${theme.color}, transparent)` }}
        />
      </div>

      {/* MAIN ICON - MONSTER QUALITY */}
      <div className="relative z-10 flex flex-col items-center gap-4 group-hover/sticker-content:scale-110 transition-transform duration-700">
        <div className="relative">
           {/* Shadow depth */}
           <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-4 bg-black/40 blur-xl rounded-full" />
           <span 
             className={`text-7xl select-none transition-all duration-1000 drop-shadow-[0_20px_30px_rgba(0,0,0,0.8)] ${
               unlocked ? "animate-float" : "grayscale opacity-10"
             }`}
             style={{ 
               filter: unlocked ? `drop-shadow(0 0 20px ${theme.color}40)` : "none" 
             }}
           >
             {theme.emoji}
           </span>
        </div>
        
        {unlocked && (
           <div className="space-y-1">
              <p className="text-[8px] font-heading text-white tracking-[0.4em] uppercase opacity-40">Guardião da {theme.label}</p>
              {rarity === "gold" && (
                <div className="flex items-center gap-2 justify-center">
                   <div className="w-1 h-1 rounded-full bg-yellow-400 animate-ping" />
                   <span className="text-[10px] font-heading text-yellow-400 tracking-[0.2em] uppercase italic drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]">Lendária</span>
                   <div className="w-1 h-1 rounded-full bg-yellow-400 animate-ping" />
                </div>
              )}
           </div>
        )}
      </div>

      {/* HOLOGRAPHIC SHIMMER OVERLAY - AAA */}
      {unlocked && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-0 group-hover/sticker-content:opacity-100 transition-opacity duration-1000">
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent -translate-x-full group-hover/sticker-content:animate-[shimmer_2s_infinite] mix-blend-overlay" />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400/5 via-purple-400/5 to-pink-400/5 mix-blend-screen opacity-40" />
        </div>
      )}

      {/* CARD DEPTH BEZEL */}
      <div className="absolute inset-0 border border-white/5 rounded-[inherit] pointer-events-none" />
      <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.4)] pointer-events-none" />

      {/* LOCKED STATE - MONSTER QUALITY */}
      {!unlocked && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center border-t border-white/5">
           <div className="relative group/lock">
              <div className="absolute -inset-4 bg-primary/10 blur-xl rounded-full opacity-0 group-hover/lock:opacity-100 transition-opacity" />
              <span className="text-3xl opacity-20 relative z-10 group-hover:scale-125 transition-transform duration-500">🔮</span>
           </div>
        </div>
      )}
    </div>
  );
}
