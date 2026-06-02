import { memo } from "react";
import {
  Sun, Mars, Swords, Scale, Settings, Crown, AlertTriangle, Zap, Circle, Link2,
  Tent, CheckCircle2, Plane, Mail, PenLine, Pencil, Check, X, Ban, Sparkles, Star,
  Snowflake, XCircle, HelpCircle, Heart, Plus, Tornado, Rainbow, Stars, Globe, Moon,
  Sprout, Trees, Wheat, Leaf, Drumstick, Candy, Cookie, Gift, Cake, Ghost, PartyPopper,
  Backpack, GraduationCap, Video, Palette, Glasses, Drama, Target, Dices, SquareStack,
  Music, Medal, Trophy, Dumbbell, Building2, Home, Landmark, Store, Castle, Bug, Snail,
  Dog, PawPrint, ThumbsUp, Shirt, Footprints, User, Users, Baby, UserCircle2, Skull,
  Gem, HeartCrack, Lightbulb, Flame, Droplet, Wind, MessageCircle, Coins, CreditCard,
  DollarSign, Folder, Calendar, BarChart3, ClipboardList, Pin, MapPin, Notebook,
  BookOpen, Book, Scroll, FileText, Phone, Megaphone, Send, Inbox, Package, Mailbox,
  Newspaper, Smartphone, Camera, RefreshCw, Search, KeyRound, Lock, Link, Hammer,
  Sparkle, Bird, Candle, Trash2, Key, ScrollText, MessageSquare, Map, Smile, SmilePlus,
  Meh, Frown, AlertCircle, Bed, Rocket, DoorOpen, ShoppingBag, LifeBuoy, Wrench, Shield,
  Award, Handshake, Cat, Squirrel, Brain, FlaskConical, Compass, Briefcase, Receipt,
  Wand2, type LucideIcon,
} from "lucide-react";

// Mapa "emoji → ícone Lucide + cor mágica" para todo o portal.
// Mantém o emoji como chave (dados podem continuar usando strings de emoji),
// e renderiza um ícone vetorial dourado/colorido em vez do glifo de sistema.
type IconSpec = { I: LucideIcon; c?: string };

const GOLD = "#c9a84c";
const RED = "#ef4444";
const GREEN = "#22c55e";
const BLUE = "#60a5fa";
const YELLOW = "#facc15";
const PURPLE = "#a78bfa";
const PINK = "#f472b6";
const ORANGE = "#fb923c";
const SILVER = "#cbd5e1";

const MAP: Record<string, IconSpec> = {
  // Símbolos / status
  "☀": { I: Sun, c: YELLOW }, "♂": { I: Mars, c: BLUE },
  "⚔": { I: Swords, c: SILVER }, "⚖": { I: Scale, c: GOLD },
  "⚙": { I: Settings, c: SILVER }, "⚜": { I: Crown, c: GOLD },
  "⚠": { I: AlertTriangle, c: YELLOW }, "⚡": { I: Zap, c: YELLOW },
  "⚫": { I: Circle, c: "#0f172a" }, "⛓": { I: Link2, c: SILVER },
  "⛺": { I: Tent, c: ORANGE }, "✅": { I: CheckCircle2, c: GREEN },
  "✈": { I: Plane, c: BLUE }, "✉": { I: Mail, c: GOLD },
  "✍": { I: PenLine, c: GOLD }, "✏": { I: Pencil, c: YELLOW },
  "✓": { I: Check, c: GREEN }, "✕": { I: X, c: RED },
  "✖": { I: X, c: RED }, "✗": { I: Ban, c: RED },
  "✦": { I: Sparkle, c: GOLD }, "✧": { I: Sparkle, c: GOLD },
  "✨": { I: Sparkles, c: GOLD }, "❄": { I: Snowflake, c: BLUE },
  "❌": { I: XCircle, c: RED }, "❓": { I: HelpCircle, c: BLUE },
  "❤": { I: Heart, c: RED }, "➕": { I: Plus, c: GREEN },

  // Natureza / clima
  "🌀": { I: Tornado, c: BLUE }, "🌈": { I: Rainbow, c: PINK },
  "🌌": { I: Stars, c: PURPLE }, "🌍": { I: Globe, c: GREEN },
  "🌙": { I: Moon, c: SILVER }, "🌟": { I: Star, c: GOLD },
  "🌱": { I: Sprout, c: GREEN }, "🌳": { I: Trees, c: GREEN },
  "🌾": { I: Wheat, c: YELLOW }, "🌿": { I: Leaf, c: GREEN },

  // Comida / festa
  "🍖": { I: Drumstick, c: ORANGE }, "🍬": { I: Candy, c: PINK },
  "🍭": { I: Candy, c: PINK }, "🎁": { I: Gift, c: RED },
  "🎂": { I: Cake, c: PINK }, "🎃": { I: Ghost, c: ORANGE },
  "🎈": { I: PartyPopper, c: PINK }, "🎉": { I: PartyPopper, c: GOLD },

  // Escolar / criativo
  "🎒": { I: Backpack, c: ORANGE }, "🎓": { I: GraduationCap, c: GOLD },
  "🎥": { I: Video, c: SILVER }, "🎨": { I: Palette, c: PINK },
  "🎩": { I: Glasses, c: GOLD }, "🎭": { I: Drama, c: PURPLE },
  "🎯": { I: Target, c: RED }, "🎲": { I: Dices, c: SILVER },
  "🎴": { I: SquareStack, c: GOLD }, "🎵": { I: Music, c: PURPLE },

  // Conquistas
  "🏅": { I: Medal, c: GOLD }, "🏆": { I: Trophy, c: GOLD },
  "🏋": { I: Dumbbell, c: SILVER },
  "🏏": { I: Swords, c: SILVER }, "🏐": { I: Circle, c: YELLOW },

  // Lugares
  "🏛": { I: Landmark, c: SILVER }, "🏠": { I: Home, c: GOLD },
  "🏦": { I: Building2, c: GOLD }, "🏪": { I: Store, c: ORANGE },
  "🏰": { I: Castle, c: GOLD },

  // Criaturas mágicas
  "🐉": { I: Bug, c: GREEN }, "🐍": { I: Snail, c: GREEN },
  "🐺": { I: Dog, c: SILVER }, "🐾": { I: PawPrint, c: GOLD },

  // Pessoas / interação
  "👍": { I: ThumbsUp, c: GREEN }, "👑": { I: Crown, c: GOLD },
  "👗": { I: Shirt, c: PINK }, "👣": { I: Footprints, c: GOLD },
  "👤": { I: User, c: SILVER }, "👥": { I: Users, c: SILVER },
  "👧": { I: User, c: PINK }, "👨": { I: User, c: BLUE },
  "👩": { I: User, c: PINK }, "👪": { I: Users, c: GOLD },

  // Místico
  "💀": { I: Skull, c: SILVER }, "💌": { I: Mail, c: PINK },
  "💎": { I: Gem, c: BLUE }, "💔": { I: HeartCrack, c: RED },
  "💕": { I: Heart, c: PINK }, "💚": { I: Heart, c: GREEN },
  "💜": { I: Heart, c: PURPLE }, "💡": { I: Lightbulb, c: YELLOW },
  "💥": { I: Zap, c: ORANGE }, "💧": { I: Droplet, c: BLUE },
  "💨": { I: Wind, c: SILVER }, "💫": { I: Sparkles, c: GOLD },
  "💬": { I: MessageCircle, c: BLUE }, "💰": { I: Coins, c: GOLD },
  "💳": { I: CreditCard, c: SILVER }, "💸": { I: DollarSign, c: GREEN },

  // Documentos / mídia
  "📁": { I: Folder, c: YELLOW }, "📅": { I: Calendar, c: BLUE },
  "📊": { I: BarChart3, c: BLUE }, "📋": { I: ClipboardList, c: SILVER },
  "📌": { I: Pin, c: RED }, "📍": { I: MapPin, c: RED },
  "📓": { I: Notebook, c: BLUE }, "📔": { I: Notebook, c: GOLD },
  "📖": { I: BookOpen, c: GOLD }, "📗": { I: Book, c: GREEN },
  "📚": { I: BookOpen, c: ORANGE }, "📜": { I: Scroll, c: GOLD },
  "📝": { I: FileText, c: YELLOW }, "📞": { I: Phone, c: GREEN },
  "📣": { I: Megaphone, c: ORANGE }, "📤": { I: Send, c: BLUE },
  "📥": { I: Inbox, c: BLUE }, "📦": { I: Package, c: ORANGE },
  "📮": { I: Mailbox, c: RED }, "📰": { I: Newspaper, c: SILVER },
  "📱": { I: Smartphone, c: SILVER }, "📷": { I: Camera, c: SILVER },
  "📸": { I: Camera, c: GOLD },

  // Ações / segurança
  "🔄": { I: RefreshCw, c: BLUE }, "🔍": { I: Search, c: SILVER },
  "🔐": { I: KeyRound, c: GOLD }, "🔒": { I: Lock, c: SILVER },
  "🔗": { I: Link, c: BLUE }, "🔥": { I: Flame, c: ORANGE },
  "🔨": { I: Hammer, c: GOLD }, "🔮": { I: Sparkle, c: PURPLE },

  // Esotérico
  "🕊": { I: Bird, c: SILVER }, "🕯": { I: Candle, c: GOLD },
  "🗑": { I: Trash2, c: RED }, "🗝": { I: Key, c: GOLD },
  "🗞": { I: Newspaper, c: SILVER }, "🗣": { I: Megaphone, c: ORANGE },
  "🗺": { I: Map, c: GOLD },

  // Emoções
  "😊": { I: Smile, c: YELLOW }, "😍": { I: SmilePlus, c: PINK },
  "😐": { I: Meh, c: SILVER }, "😢": { I: Frown, c: BLUE },
  "😰": { I: AlertCircle, c: BLUE }, "😱": { I: AlertCircle, c: PURPLE },
  "😴": { I: Bed, c: BLUE },

  // Diversos
  "🚀": { I: Rocket, c: ORANGE }, "🚪": { I: DoorOpen, c: GOLD },
  "🚫": { I: Ban, c: RED }, "🛍": { I: ShoppingBag, c: PINK },
  "🛟": { I: LifeBuoy, c: RED }, "🛠": { I: Wrench, c: SILVER },
  "🛡": { I: Shield, c: BLUE }, "🟢": { I: Circle, c: GREEN },
  "🟫": { I: Circle, c: "#92400e" },

  // Reações
  "🤔": { I: HelpCircle, c: YELLOW }, "🤝": { I: Handshake, c: GOLD },
  "🤩": { I: Sparkles, c: GOLD },

  // Esportes / medalhas
  "🥅": { I: Target, c: SILVER }, "🥇": { I: Medal, c: GOLD },
  "🥈": { I: Medal, c: SILVER }, "🥉": { I: Medal, c: "#cd7f32" },
  "🥰": { I: Heart, c: PINK }, "🥻": { I: Shirt, c: PURPLE },

  // Animais simbólicos das casas
  "🦁": { I: Cat, c: ORANGE },   // Grifinória
  "🦄": { I: Sparkle, c: PINK },
  "🦅": { I: Bird, c: BLUE },    // Corvinal
  "🦉": { I: Bird, c: GOLD },
  "🦊": { I: Dog, c: ORANGE },
  "🦌": { I: Squirrel, c: ORANGE },
  "🦡": { I: Squirrel, c: YELLOW }, // Lufa-Lufa

  // Místico final
  "🧙": { I: Wand2, c: PURPLE }, "🧠": { I: Brain, c: PINK },
  "🧪": { I: FlaskConical, c: GREEN }, "🧭": { I: Compass, c: GOLD },
  "🧹": { I: Wand2, c: GOLD }, "🧾": { I: Receipt, c: SILVER },
  "🩸": { I: Droplet, c: RED }, "🪄": { I: Wand2, c: GOLD },
  "🪙": { I: Coins, c: GOLD }, "🫂": { I: Users, c: PINK },
};

interface Props {
  e?: string;          // emoji original
  size?: number;       // tamanho em px (default 20)
  className?: string;
  title?: string;
}

/**
 * EmojiIcon — renderiza um ícone vetorial (Lucide) no lugar de um emoji.
 * Mantém "monster quality" consistente no portal inteiro, sem depender
 * da fonte de emoji do sistema (que renderiza como caixinha em muitos OS).
 * Se o emoji não estiver mapeado, faz fallback para um Sparkles dourado.
 */
const EmojiIcon = memo(function EmojiIcon({ e, size = 20, className = "", title }: Props) {
  if (!e) return null;
  // Normaliza removendo variation selector (U+FE0F) que aparece em alguns emojis
  const key = e.replace(/\uFE0F/g, "").trim();
  const spec = MAP[key] || MAP[key[0]] || { I: Sparkles, c: GOLD };
  const { I, c } = spec;
  return (
    <I
      size={size}
      strokeWidth={1.8}
      className={`inline-block align-[-0.15em] drop-shadow-[0_0_6px_currentColor] ${className}`}
      style={{ color: c }}
      aria-label={title || e}
    />
  );
});

export default EmojiIcon;

/** Helper para uso fora do JSX (ex.: alt text, fallbacks). */
export const hasEmojiIcon = (e: string) => Boolean(MAP[e?.replace(/\uFE0F/g, "")?.trim()]);