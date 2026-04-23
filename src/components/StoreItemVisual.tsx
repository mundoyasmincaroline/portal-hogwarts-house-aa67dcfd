import SafeImage from "@/components/SafeImage";

/**
 * StoreItemVisual — arte digital para itens da loja Gringotts
 * Gerado 100% em código: gradientes, SVG e animações por casa/categoria.
 * Funciona sempre, sem servidor de imagens.
 */

type VisualTheme = {
  bg: string;
  accent: string;
  glow: string;
  Icon: React.FC<{ size?: number; color?: string; style?: React.CSSProperties }>;
  badge: string;
  particles: { x: number; y: number; size: number; delay: number }[];
  border: string;
};

// ─── Ícones SVG inline por categoria ───────────────────────────────────────
const RobeIcon = ({ color = "#fff", size = 80 }: { color?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M50 10 C40 10 30 18 28 28 L18 80 Q18 85 24 85 L76 85 Q82 85 82 80 L72 28 C70 18 60 10 50 10Z"
      fill={color} fillOpacity="0.15" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    <path d="M50 10 L38 30 M50 10 L62 30" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <path d="M38 30 Q50 38 62 30" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none" />
    <path d="M28 50 Q50 55 72 50" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none" strokeDasharray="3 3" />
    <circle cx="50" cy="25" r="3" fill={color} fillOpacity="0.8" />
  </svg>
);

const WandIcon = ({ color = "#fff", size = 80 }: { color?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="20" y1="80" x2="72" y2="28" stroke={color} strokeWidth="4" strokeLinecap="round" />
    <circle cx="72" cy="28" r="10" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="2" />
    <circle cx="72" cy="28" r="5" fill={color} fillOpacity="0.8" />
    <path d="M72 18 L75 10 M82 28 L90 25 M79 20 L85 14" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <path d="M45 55 L38 62 M55 45 L62 38" stroke={color} strokeWidth="1" strokeLinecap="round" strokeDasharray="2 3" />
  </svg>
);

const GemIcon = ({ color = "#fff", size = 80 }: { color?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polygon points="50,15 75,35 75,65 50,85 25,65 25,35"
      fill={color} fillOpacity="0.15" stroke={color} strokeWidth="2" />
    <polygon points="50,15 75,35 50,50 25,35" fill={color} fillOpacity="0.3" />
    <line x1="50" y1="15" x2="50" y2="85" stroke={color} strokeWidth="1" strokeOpacity="0.4" />
    <line x1="25" y1="50" x2="75" y2="50" stroke={color} strokeWidth="1" strokeOpacity="0.4" />
    <circle cx="50" cy="50" r="4" fill={color} fillOpacity="0.9" />
    <path d="M35 25 L28 18 M65 25 L72 18 M50 15 L50 8" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const BroomIcon = ({ color = "#fff", size = 80 }: { color?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="15" y1="85" x2="78" y2="22" stroke={color} strokeWidth="3.5" strokeLinecap="round" />
    <path d="M70 28 Q88 20 90 12 Q80 8 68 18 Q60 24 62 34Z"
      fill={color} fillOpacity="0.3" stroke={color} strokeWidth="1.5" />
    <path d="M72 26 Q85 22 88 15 M66 32 Q80 28 84 20"
      stroke={color} strokeWidth="1" strokeLinecap="round" />
    <circle cx="30" cy="70" r="3" fill={color} fillOpacity="0.6" />
    <circle cx="50" cy="50" r="2" fill={color} fillOpacity="0.4" />
  </svg>
);

const StarIcon = ({ color = "#fff", size = 80 }: { color?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polygon points="50,10 61,37 90,37 67,57 76,84 50,65 24,84 33,57 10,37 39,37"
      fill={color} fillOpacity="0.2" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    <circle cx="50" cy="50" r="8" fill={color} fillOpacity="0.7" />
    <path d="M50 10 L50 20 M90 37 L80 42 M76 84 L68 75 M24 84 L32 75 M10 37 L20 42"
      stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const CrownIcon = ({ color = "#fff", size = 80 }: { color?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 70 L15 40 L30 55 L50 20 L70 55 L85 40 L85 70Z"
      fill={color} fillOpacity="0.2" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    <rect x="15" y="70" width="70" height="10" rx="3" fill={color} fillOpacity="0.4" stroke={color} strokeWidth="1.5" />
    <circle cx="50" cy="20" r="5" fill={color} fillOpacity="0.9" />
    <circle cx="15" cy="40" r="4" fill={color} fillOpacity="0.7" />
    <circle cx="85" cy="40" r="4" fill={color} fillOpacity="0.7" />
  </svg>
);

// ─── Temas por nome/categoria ───────────────────────────────────────────────
function getTheme(name: string, category: string): VisualTheme {
  const n = name.toLowerCase();
  const STARS = (count: number) =>
    Array.from({ length: count }, (_, i) => ({
      x: 10 + Math.round((i * 83) % 90),
      y: 10 + Math.round((i * 67) % 80),
      size: 1 + (i % 3),
      delay: (i * 0.3) % 2,
    }));

  if (n.includes("grifin") || n.includes("gryffin"))
    return { bg: "from-red-950 via-red-900/80 to-yellow-950", accent: "#EF4444", glow: "#DC2626", border: "border-red-500/50", Icon: (p) => <RobeIcon color="#FCA5A5" {...p} />, badge: "🦁", particles: STARS(8) };
  if (n.includes("sonser") || n.includes("slyther"))
    return { bg: "from-emerald-950 via-green-900/70 to-slate-950", accent: "#10B981", glow: "#059669", border: "border-emerald-500/50", Icon: (p) => <RobeIcon color="#6EE7B7" {...p} />, badge: "🐍", particles: STARS(6) };
  if (n.includes("corvin") || n.includes("raven"))
    return { bg: "from-blue-950 via-blue-900/70 to-slate-950", accent: "#60A5FA", glow: "#3B82F6", border: "border-blue-500/50", Icon: (p) => <RobeIcon color="#93C5FD" {...p} />, badge: "🦅", particles: STARS(7) };
  if (n.includes("lufa") || n.includes("hufflep"))
    return { bg: "from-yellow-900 via-amber-800/60 to-stone-950", accent: "#FBBF24", glow: "#D97706", border: "border-yellow-500/50", Icon: (p) => <RobeIcon color="#FDE68A" {...p} />, badge: "🦡", particles: STARS(7) };
  if (n.includes("manto") || category === "clothing")
    return { bg: "from-purple-950 via-violet-900/70 to-slate-950", accent: "#C084FC", glow: "#9333EA", border: "border-purple-500/50", Icon: (p) => <RobeIcon color="#E9D5FF" {...p} />, badge: "✨", particles: STARS(6) };
  if (n.includes("varinha") || category === "wand")
    return { bg: "from-violet-950 via-purple-900/80 to-indigo-950", accent: "#A855F7", glow: "#7C3AED", border: "border-purple-400/50", Icon: (p) => <WandIcon color="#DDD6FE" {...p} />, badge: "⚡", particles: STARS(10) };
  if (n.includes("vassoura") || n.includes("nimbus") || n.includes("saeta"))
    return { bg: "from-amber-950 via-orange-900/70 to-stone-950", accent: "#F59E0B", glow: "#D97706", border: "border-orange-500/50", Icon: (p) => <BroomIcon color="#FDE68A" {...p} />, badge: "🔮", particles: STARS(5) };
  if (n.includes("amuleto") || n.includes("anel") || n.includes("colar") || n.includes("galeon"))
    return { bg: "from-amber-950 via-yellow-900/70 to-stone-950", accent: "#FBBF24", glow: "#B45309", border: "border-yellow-500/50", Icon: (p) => <GemIcon color="#FEF08A" {...p} />, badge: "💎", particles: STARS(9) };
  if (n.includes("vip") || n.includes("coroa") || n.includes("titulo"))
    return { bg: "from-yellow-900 via-amber-800/60 to-orange-950", accent: "#F59E0B", glow: "#B45309", border: "border-yellow-400/60", Icon: (p) => <CrownIcon color="#FDE68A" {...p} />, badge: "👑", particles: STARS(8) };
  // Default — item mágico genérico
  return { bg: "from-slate-900 via-purple-950/60 to-slate-900", accent: "#818CF8", glow: "#6366F1", border: "border-white/10", Icon: (p) => <StarIcon color="#C7D2FE" {...p} />, badge: "🌟", particles: STARS(8) };
}

// ─── Componente Principal ───────────────────────────────────────────────────
interface Props {
  imageUrl?: string | null;
  name: string;
  category: string;
  isOwned?: boolean;
}

// Mapeamento de imagens épicas para categorias caso o item não tenha imagem
function getEpicPlaceholder(category: string, name: string): string {
  const n = name.toLowerCase();
  
  if (category === "clothing" || n.includes("robe") || n.includes("manto") || n.includes("capa")) 
    return "/items/manto_premium.png";
    
  if (category === "wand" || n.includes("varinha")) 
    return "/items/varinha_premium.png";
    
  if (category === "accessory" || n.includes("anel") || n.includes("colar") || n.includes("amuleto") || n.includes("joia")) 
    return "/items/amuleto_premium.png";
    
  if (category === "featured" || n.includes("coroa") || n.includes("vip") || n.includes("skin")) 
    return "/items/coroa_premium.png";
    
  return "/items/manto_premium.png";
}


export default function StoreItemVisual({ imageUrl, name, category, isOwned }: Props) {
  const finalImage = (imageUrl && !imageUrl.includes("placeholder")) 
    ? imageUrl 
    : getEpicPlaceholder(category, name);
    
  const theme = getTheme(name, category);

  return (
    <div className={`relative w-full h-full bg-black group overflow-hidden border-2 ${theme.border} rounded-[2rem] shadow-2xl`}>
      <SafeImage 
        src={finalImage} 
        alt={name}
        className="w-full h-full object-cover group-hover:scale-125 group-hover:rotate-2 transition-all duration-[2000ms] opacity-90"
        fallbackEmoji="📦"
      />
      
      {/* Premium Cinematic Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent pointer-events-none z-10" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_30%,rgba(0,0,0,0.8)_100%)] pointer-events-none z-10" />
      
      {/* Holographic Shimmer */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-40 mix-blend-overlay transition-opacity duration-1000 bg-gradient-to-tr from-yellow-500 via-transparent to-blue-500 pointer-events-none z-20" />
      
      {/* Dynamic Particles */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {theme.particles.map((p, i) => (
          <div key={i} className="absolute w-1 h-1 bg-white rounded-full animate-pulse opacity-40" style={{
            top: `${p.y}%`,
            left: `${p.x}%`,
            animationDelay: `${p.delay}s`
          }} />
        ))}
      </div>

      {isOwned && (
        <div className="absolute inset-0 bg-green-950/70 backdrop-blur-md flex flex-col items-center justify-center z-30 animate-in fade-in duration-500">
          <div className="flex flex-col items-center gap-3 transform group-hover:scale-110 transition-all duration-700">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500/40 shadow-[0_0_30px_rgba(34,197,94,0.4)]">
                <span className="text-4xl">✅</span>
            </div>
            <span className="font-heading text-green-400 text-sm font-bold uppercase tracking-[0.3em] drop-shadow-lg">Relíquia Obtida</span>
          </div>
        </div>
      )}
    </div>
  );
}
