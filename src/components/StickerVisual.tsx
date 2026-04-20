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
  if (imageUrl && !failedImage) return null; // let parent render the <img>

  const stars = Array.from({ length: 6 }, (_, i) => ({
    x: 10 + (i * 73) % 85,
    y: 5 + (i * 57) % 85,
    size: 1.5 + (i % 3) * 0.8,
    delay: i * 0.4,
  }));

  return (
    <div className={`absolute inset-0 bg-gradient-to-br ${style.bg} flex items-center justify-center overflow-hidden`}>

      {/* Stars */}
      {stars.map((s, i) => (
        <div key={i} className="absolute rounded-full animate-pulse"
          style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.size * 2, height: s.size * 2,
            background: style.shine, opacity: unlocked ? 0.5 : 0.15,
            animationDelay: `${s.delay}s`, animationDuration: "2s" }} />
      ))}

      {/* Glow circle */}
      <div className="absolute" style={{
        width: 100, height: 100,
        background: `radial-gradient(circle, ${theme.color}30 0%, transparent 70%)`,
        borderRadius: "50%", filter: "blur(16px)",
      }} />

      {/* Main emoji — big and glowing */}
      <div className="relative z-10 flex flex-col items-center gap-1"
        style={{ filter: unlocked ? `drop-shadow(0 0 14px ${theme.color}80)` : "none" }}>
        <span className={`text-6xl select-none transition-all ${unlocked ? "" : "grayscale opacity-30"}`}>
          {theme.emoji}
        </span>
        {rarity === "gold" && unlocked && (
          <span className="text-[10px] font-heading text-yellow-400 tracking-widest uppercase opacity-80">✦ Raro ✦</span>
        )}
      </div>

      {/* Shimmer overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Rarity top line */}
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${style.shine}80, transparent)` }} />

      {/* Locked overlay */}
      {!unlocked && (
        <div className="absolute inset-0 bg-background/40 flex items-center justify-center">
          <div className="flex flex-col items-center gap-1">
            <span className="text-2xl opacity-60">🔮</span>
          </div>
        </div>
      )}
    </div>
  );
}
