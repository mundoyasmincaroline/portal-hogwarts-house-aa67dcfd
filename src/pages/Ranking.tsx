import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { HOUSES, getLevelFromXP, type House } from "@/lib/store";
import { isUserOnline } from "@/lib/auth";
import HouseCrest from "@/components/HouseCrest";
import MedalBadge from "@/components/MedalBadge";
import SafeImage from "@/components/SafeImage";
import MagicalEmoji from "@/components/MagicalEmoji";
import MagicalGaleon from "@/components/MagicalGaleon";
import { useNavigate } from "react-router-dom";
import { Trophy, Zap, Crown } from "lucide-react";

interface RankMember {
  user_id: string;
  full_name: string;
  username: string;
  avatar_url?: string;
  house: House;
  xp: number;
  level: number;
  galeons?: number;
  vip_plan?: string;
  last_seen?: string;
}

const HOUSE_COLORS: Record<string, { ring: string; bg: string; text: string }> = {
  gryffindor: { ring: "ring-red-500/50",   bg: "from-red-900/30 to-transparent",    text: "text-red-400" },
  slytherin:  { ring: "ring-green-500/50",  bg: "from-green-900/30 to-transparent",  text: "text-green-400" },
  ravenclaw:  { ring: "ring-blue-500/50",   bg: "from-blue-900/30 to-transparent",   text: "text-blue-400" },
  hufflepuff: { ring: "ring-yellow-500/50", bg: "from-yellow-900/30 to-transparent", text: "text-yellow-400" },
};

const PODIUM_ORDER = [1, 0, 2]; // silver, gold, bronze visual order

export default function Ranking() {
  const navigate = useNavigate();
  const [members, setMembers] = useState<RankMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"geral" | "casas">("geral");
  const [housePoints, setHousePoints] = useState<Record<string, number>>({});

  useEffect(() => {
    loadRanking();
    loadHousePoints();
  }, []);

  const loadRanking = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("user_id, full_name, username, avatar_url, house, xp, level, galeons, vip_plan, last_seen")
      .eq("approved", true)
      .order("xp", { ascending: false })
      .limit(50);
    setMembers((data || []) as RankMember[]);
    setLoading(false);
  };

  const loadHousePoints = async () => {
    const { data } = await supabase
      .from("house_points")
      .select("house, points");
    if (data) {
      const totals: Record<string, number> = {};
      data.forEach((row: any) => {
        totals[row.house] = (totals[row.house] || 0) + (row.points || 0);
      });
      setHousePoints(totals);
    }
  };

  const top3 = members.slice(0, 3);
  const rest = members.slice(3);

  const vipBadge = (plan?: string) => {
    if (plan === "founder") return <span className="text-[9px] font-heading px-1.5 py-0.5 rounded-full bg-gradient-to-r from-yellow-600 to-amber-400 text-black">👑</span>;
    if (plan === "vip")     return <span className="text-[9px] font-heading px-1.5 py-0.5 rounded-full bg-gradient-to-r from-purple-600 to-purple-400 text-white">🥇</span>;
    if (plan === "premium") return <span className="text-[9px] font-heading px-1.5 py-0.5 rounded-full bg-gradient-to-r from-blue-600 to-blue-400 text-white">✨</span>;
    return null;
  };

  const sortedHouses = Object.entries(HOUSES).sort(
    ([a], [b]) => (housePoints[b] || 0) - (housePoints[a] || 0)
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10 px-2 sm:px-0">

      {/* Header */}
      <div className="glass rounded-2xl sm:rounded-3xl p-6 sm:p-8 relative overflow-hidden border border-primary/20 text-center">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-yellow-900/10" />
        <div className="relative z-10">
          <Trophy size={40} className="mx-auto text-yellow-400 mb-3 drop-shadow-[0_0_12px_rgba(251,191,36,0.5)]" />
          <h1 className="font-heading text-3xl text-gold-gradient mb-1">Ranking de Bruxos</h1>
          <p className="text-muted-foreground text-sm">Os mais poderosos do Portal Hogwarts House</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[{ id: "geral", label: "🏆 Ranking Geral" }, { id: "casas", label: "🏰 Pontuação das Casas" }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={`px-4 py-2 rounded-full text-sm font-heading transition-all border ${
              tab === t.id ? "bg-primary/20 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/50"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="glass rounded-2xl p-16 text-center">
          <div className="text-4xl animate-bounce mb-4">⚡</div>
          <p className="text-muted-foreground animate-pulse font-heading">Consultando o Livro dos Feiticeiros...</p>
        </div>
      ) : tab === "geral" ? (
        <>
          {/* Pódio Top 3 */}
          {top3.length > 0 && (
            <div className="flex flex-row items-end justify-center gap-2 sm:gap-4 px-2 sm:px-4">
              {PODIUM_ORDER.map(idx => {
                const m = top3[idx];
                if (!m) return null;
                const isGold = idx === 0;
                const colors = HOUSE_COLORS[m.house] || HOUSE_COLORS.gryffindor;
                const heights = ["h-28", "h-36", "h-24"];
                const medals = ["🥈", "🥇", "🥉"];
                return (
                  <div key={m.user_id}
                    onClick={() => navigate(`/dashboard/profile/${m.user_id}`)}
                    className={`flex-1 min-w-0 glass rounded-2xl border cursor-pointer hover:-translate-y-1 transition-all bg-gradient-to-b ${colors.bg} ${
                      isGold ? `ring-2 ring-yellow-400/60 border-yellow-400/40 shadow-[0_0_30px_rgba(251,191,36,0.2)]` : `border-border/40`
                    }`}>
                    <div className={`flex flex-col items-center p-2 sm:p-4 gap-1 sm:gap-2 ${heights[idx]}`}>
                      <div className="relative w-12 h-12 mb-1 flex items-center justify-center">
                        <MagicalEmoji 
                          emoji={idx === 1 ? "🥇" : idx === 0 ? "🥈" : "🥉"} 
                          size="sm" 
                          glowColor={idx === 1 ? "rgba(234, 179, 8, 0.4)" : idx === 0 ? "rgba(148, 163, 184, 0.3)" : "rgba(180, 83, 9, 0.3)"} 
                        />
                      </div>
                      <div className="relative">
                        <SafeImage 
                          src={m.avatar_url} 
                          alt={m.full_name} 
                          className={`w-10 h-10 sm:w-14 sm:h-14 rounded-full object-cover border-2 ${isGold ? "border-yellow-400" : "border-border"}`} 
                        />
                        {isGold && (
                          <Crown size={16} className="absolute -top-2 left-1/2 -translate-x-1/2 text-yellow-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.8)]" />
                        )}
                      </div>
                      <div className="text-center min-w-0">
                        <p className="font-heading text-[10px] sm:text-xs text-foreground truncate w-full flex items-center gap-1 justify-center">
                          {m.full_name.split(" ")[0]}
                          {vipBadge(m.vip_plan)}
                        </p>
                        <p className="text-[10px] text-muted-foreground">@{m.username}</p>
                        <p className={`font-heading text-sm ${colors.text} mt-1`}>{m.xp.toLocaleString("pt-BR")} XP</p>
                        <HouseCrest house={m.house} size="sm" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Lista completa */}
          <div className="glass rounded-2xl overflow-hidden border border-border/50">
            <div className="px-4 py-3 border-b border-border/50 flex items-center gap-2">
              <Zap size={14} className="text-primary" />
              <span className="font-heading text-sm text-primary">Ranking Completo</span>
              <span className="ml-auto text-xs text-muted-foreground">{members.length} bruxos</span>
            </div>
            {members.map((m, i) => {
              const levelInfo = getLevelFromXP(m.xp);
              const online = isUserOnline(m as any);
              const colors = HOUSE_COLORS[m.house] || HOUSE_COLORS.gryffindor;
              const rankEmoji = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
              return (
                <div key={m.user_id}
                  onClick={() => navigate(`/dashboard/profile/${m.user_id}`)}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-secondary/30 transition-colors ${
                    i !== members.length - 1 ? "border-b border-border/30" : ""
                  } ${i < 3 ? `bg-gradient-to-r ${colors.bg}` : ""}`}>

                  {/* Posição */}
                  <div className="w-8 text-center shrink-0">
                    {rankEmoji ? (
                      <span className="text-lg">{rankEmoji}</span>
                    ) : (
                      <span className="text-sm font-heading text-muted-foreground">#{i + 1}</span>
                    )}
                  </div>

                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <SafeImage 
                      src={m.avatar_url} 
                      alt={m.full_name} 
                      className="w-9 h-9 rounded-full object-cover border border-border" 
                    />
                    <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-card ${online ? "bg-green-500" : "bg-muted-foreground/50"}`} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm font-heading text-foreground truncate">{m.full_name}</p>
                      <MedalBadge xp={m.xp} />
                      {vipBadge(m.vip_plan)}
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] text-muted-foreground">@{m.username}</p>
                      <HouseCrest house={m.house} size="sm" />
                      <span className="text-[10px] text-muted-foreground">{levelInfo.name}</span>
                    </div>
                  </div>

                  {/* XP */}
                  <div className="text-right shrink-0">
                    <p className={`font-heading text-sm ${colors.text}`}>{m.xp.toLocaleString("pt-BR")} XP</p>
                    {(m.galeons || 0) > 0 && (
                      <p className="text-[10px] text-yellow-500/80 flex items-center gap-1 justify-end">
                        <MagicalGaleon size="xs" className="scale-75" /> {m.galeons}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}

            {members.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-3xl mb-3">🧙</p>
                <p>Nenhum bruxo encontrado ainda.</p>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Ranking por casas */
        <div className="space-y-4">
          {sortedHouses.map(([houseId, house], i) => {
            const pts = housePoints[houseId] || 0;
            const maxPts = Math.max(...Object.values(housePoints), 1);
            const pct = Math.round((pts / maxPts) * 100);
            const colors = HOUSE_COLORS[houseId] || HOUSE_COLORS.gryffindor;
            const membersInHouse = members.filter(m => m.house === houseId);
            return (
              <div key={houseId}
                className={`glass rounded-2xl p-6 border bg-gradient-to-br ${colors.bg} ${
                  i === 0 ? `ring-2 ${colors.ring} shadow-[0_0_25px_rgba(0,0,0,0.3)]` : "border-border/40"
                }`}>
                <div className="flex items-center gap-4 mb-4">
                  <HouseCrest house={houseId as House} size="lg" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {i === 0 && <span className="text-xl">🏆</span>}
                      <h3 className="font-heading text-xl text-foreground">{house.name}</h3>
                      <span className={`text-xs font-heading px-2 py-0.5 rounded-full border ${colors.text} border-current`}>
                        #{i + 1}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground italic font-serif">"{house.motto}"</p>
                    <p className="text-xs text-muted-foreground mt-1">{membersInHouse.length} membros</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-heading text-2xl ${colors.text}`}>{pts.toLocaleString("pt-BR")}</p>
                    <p className="text-xs text-muted-foreground">pontos</p>
                  </div>
                </div>
                {/* Barra de progresso */}
                <div className="w-full bg-secondary/50 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-1000 ${
                      houseId === "gryffindor" ? "bg-red-500" :
                      houseId === "slytherin"  ? "bg-green-500" :
                      houseId === "ravenclaw"  ? "bg-blue-500" : "bg-yellow-500"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
