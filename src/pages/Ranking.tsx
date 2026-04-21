import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { HOUSES, getLevelFromXP, type House } from "@/lib/store";
import { isUserOnline } from "@/lib/auth";
import HouseCrest from "@/components/HouseCrest";
import MedalBadge from "@/components/MedalBadge";
import SafeImage from "@/components/SafeImage";
import { useNavigate } from "react-router-dom";
import { Trophy, Zap, Crown, Sparkles, Users } from "lucide-react";

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
    <div className="max-w-4xl mx-auto space-y-6 pb-10">

      {/* Header - Monster Quality */}
      <div className="relative overflow-hidden rounded-[3rem] bg-gradient-to-b from-white/[0.08] to-black/60 backdrop-blur-3xl p-10 md:p-14 border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.8)] text-center group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-yellow-900/10" />
        {/* Ambient Glows */}
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-yellow-500/10 rounded-full blur-[100px]" />
        
        <div className="relative z-10">
          <div className="relative inline-block mb-6">
             <div className="absolute inset-0 bg-yellow-400/40 blur-2xl rounded-full animate-pulse" />
             <Trophy size={60} className="relative z-10 text-yellow-400 drop-shadow-[0_0_20px_rgba(251,191,36,0.6)] animate-bounce-slow" />
          </div>
          <h1 className="font-heading text-4xl md:text-6xl text-gold-gradient mb-3 tracking-tighter drop-shadow-2xl">Lendas de Hogwarts</h1>
          <div className="flex items-center justify-center gap-4">
             <div className="h-px w-16 bg-gradient-to-r from-transparent to-primary/50" />
             <p className="text-xs md:text-sm font-heading text-primary uppercase tracking-[0.4em] opacity-70">O Salão da Glória Eterna</p>
             <div className="h-px w-16 bg-gradient-to-l from-transparent to-primary/50" />
          </div>
        </div>
      </div>

      {/* Tabs - Monster Quality */}
      <div className="flex flex-wrap justify-center gap-4">
        {[
          { id: "geral", label: "RANKING GERAL", icon: <Trophy size={16} /> }, 
          { id: "casas", label: "COPA DAS CASAS", icon: <Crown size={16} /> }
        ].map(t => (
          <button 
            key={t.id} 
            onClick={() => setTab(t.id as any)}
            className={`group relative px-8 py-4 rounded-2xl font-heading text-xs tracking-[0.2em] transition-all overflow-hidden border shadow-xl ${
              tab === t.id 
                ? "bg-primary text-white border-primary shadow-primary/20 scale-105" 
                : "bg-white/5 border-white/10 text-white/40 hover:text-white hover:border-white/20"
            }`}
          >
            {tab === t.id && (
               <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
            )}
            <div className="relative z-10 flex items-center gap-3">
               {t.icon}
               {t.label}
            </div>
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
          {/* Podium - Monster Quality */}
          {top3.length > 0 && (
            <div className="flex flex-col md:flex-row items-end justify-center gap-6 px-4 py-8">
              {PODIUM_ORDER.map(idx => {
                const m = top3[idx];
                if (!m) return null;
                const isGold = idx === 0;
                const colors = HOUSE_COLORS[m.house] || HOUSE_COLORS.gryffindor;
                const podiumStyle = [
                   "order-2 md:order-2 h-48 md:h-56 bg-gradient-to-b from-yellow-500/20 to-amber-900/40 border-yellow-500/40 shadow-yellow-500/20", // Gold
                   "order-1 md:order-1 h-36 md:h-44 bg-gradient-to-b from-slate-400/20 to-slate-800/40 border-slate-400/40 shadow-slate-400/10", // Silver
                   "order-3 md:order-3 h-28 md:h-36 bg-gradient-to-b from-amber-700/20 to-amber-950/40 border-amber-700/40 shadow-amber-700/10" // Bronze
                ][idx];

                return (
                  <div key={m.user_id}
                    onClick={() => navigate(`/dashboard/profile/${m.user_id}`)}
                    className={`relative w-full md:w-48 group cursor-pointer transition-all duration-500 hover:-translate-y-2 ${podiumStyle.split(' ')[0]}`}>
                    
                    {/* Character Card on Pedestal */}
                    <div className={`relative overflow-hidden glass rounded-3xl border shadow-2xl p-6 flex flex-col items-center gap-3 ${podiumStyle.split(' ').slice(1).join(' ')}`}>
                       {/* Aura Glow */}
                       <div className="absolute -top-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all" />
                       
                       <div className="relative">
                          {isGold && (
                             <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-20">
                                <Crown size={24} className="text-yellow-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.8)] animate-bounce-slow" />
                             </div>
                          )}
                          <div className="relative w-20 h-20 md:w-24 h-24">
                             <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent rounded-full p-1 shadow-2xl">
                                <SafeImage 
                                  src={m.avatar_url} 
                                  alt={m.full_name} 
                                  className="w-full h-full rounded-full object-cover border-2 border-white/10" 
                                />
                             </div>
                          </div>
                          <div className="absolute -bottom-2 -right-2 scale-110">
                             <HouseCrest house={m.house} size="sm" />
                          </div>
                       </div>

                       <div className="text-center space-y-1">
                          <p className="font-heading text-sm text-white truncate max-w-[140px] flex items-center gap-1 justify-center">
                             {m.full_name.split(" ")[0]}
                             {vipBadge(m.vip_plan)}
                          </p>
                          <p className="text-[10px] text-white/40 font-heading uppercase tracking-widest">{m.xp.toLocaleString()} XP</p>
                       </div>
                    </div>

                    {/* Rank Number Indicator */}
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center font-heading text-lg text-white shadow-xl">
                       {idx === 0 ? "1" : idx === 1 ? "2" : "3"}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Ranking List - Monster Quality */}
          <div className="relative overflow-hidden rounded-[2.5rem] bg-white/[0.02] backdrop-blur-xl border border-white/10 shadow-2xl">
            <div className="px-8 py-5 border-b border-white/5 bg-white/5 flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <Zap size={16} className="text-primary animate-pulse" />
                  <span className="font-heading text-xs tracking-[0.2em] text-white/60">HALL DA FAMA</span>
               </div>
               <span className="text-[10px] font-heading text-white/20 uppercase tracking-widest">{members.length} BRUXOS ATIVOS</span>
            </div>

            <div className="divide-y divide-white/5">
              {rest.map((m, i) => {
                const online = isUserOnline(m as any);
                const colors = HOUSE_COLORS[m.house] || HOUSE_COLORS.gryffindor;
                const absoluteRank = i + 4;
                
                return (
                  <div key={m.user_id}
                    onClick={() => navigate(`/dashboard/profile/${m.user_id}`)}
                    className="group relative flex items-center gap-4 px-6 md:px-8 py-4 cursor-pointer hover:bg-white/[0.03] transition-all overflow-hidden">
                    
                    {/* Row Shimmer */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                    <div className="w-8 text-center shrink-0">
                       <span className="text-xs font-heading text-white/30 group-hover:text-primary transition-colors">#{absoluteRank}</span>
                    </div>

                    <div className="relative shrink-0">
                       <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 p-0.5 group-hover:scale-110 transition-transform">
                          <SafeImage 
                            src={m.avatar_url} 
                            alt={m.full_name} 
                            className="w-full h-full rounded-[0.5rem] object-cover" 
                          />
                       </div>
                       <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-black ${online ? "bg-green-500" : "bg-white/10"}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                       <div className="flex items-center gap-2">
                          <p className="text-sm font-heading text-white/90 truncate group-hover:text-primary transition-colors">{m.full_name}</p>
                          {vipBadge(m.vip_plan)}
                       </div>
                       <div className="flex items-center gap-2 mt-0.5 opacity-60">
                          <HouseCrest house={m.house} size="xs" />
                          <span className="text-[9px] font-heading text-white uppercase tracking-widest">@{m.username}</span>
                       </div>
                    </div>

                    <div className="text-right shrink-0">
                       <p className={`font-heading text-sm ${colors.text} tracking-widest`}>{m.xp.toLocaleString()} XP</p>
                       <div className="flex items-center justify-end gap-1 mt-0.5">
                          <div className="h-1 w-12 bg-white/5 rounded-full overflow-hidden">
                             <div className={`h-full bg-gradient-to-r ${
                                m.house === 'gryffindor' ? 'from-red-500 to-red-800' :
                                m.house === 'slytherin' ? 'from-green-500 to-green-800' :
                                m.house === 'ravenclaw' ? 'from-blue-500 to-blue-800' : 'from-yellow-500 to-yellow-800'
                             }`} style={{ width: '70%' }} />
                          </div>
                       </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {members.length === 0 && (
              <div className="text-center py-20 opacity-30">
                <Trophy size={48} className="mx-auto mb-4" />
                <p className="font-heading text-xs tracking-widest">NENHUM REGISTRO ENCONTRADO</p>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Ranking por casas */
        <div className="grid grid-cols-1 gap-6">
          {sortedHouses.map(([houseId, house], i) => {
            const pts = housePoints[houseId] || 0;
            const maxPts = Math.max(...Object.values(housePoints), 1);
            const pct = Math.round((pts / maxPts) * 100);
            const colors = HOUSE_COLORS[houseId] || HOUSE_COLORS.gryffindor;
            const membersInHouse = members.filter(m => m.house === houseId);
            
            return (
              <div key={houseId}
                className={`relative overflow-hidden glass rounded-[3rem] p-8 border border-white/10 shadow-2xl transition-all duration-500 hover:scale-[1.02] bg-gradient-to-br ${colors.bg}`}>
                
                {/* Internal Glow */}
                <div className={`absolute -top-20 -right-20 w-64 h-64 rounded-full blur-[80px] opacity-20 ${
                  houseId === 'gryffindor' ? 'bg-red-500' :
                  houseId === 'slytherin' ? 'bg-green-500' :
                  houseId === 'ravenclaw' ? 'bg-blue-500' : 'bg-yellow-500'
                }`} />

                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                  <div className="relative group">
                     <div className="absolute inset-0 bg-white/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                     <HouseCrest house={houseId as House} size="lg" />
                  </div>

                  <div className="flex-1 text-center md:text-left space-y-2">
                    <div className="flex flex-col md:flex-row items-center gap-3">
                      <h3 className="font-heading text-3xl text-white tracking-tighter">{house.name}</h3>
                      <div className={`px-4 py-1 rounded-full border ${colors.text} border-current font-heading text-[10px] tracking-widest`}>
                        RANK #{i + 1}
                      </div>
                    </div>
                    <p className="text-sm text-white/50 italic font-serif leading-relaxed">"{house.motto}"</p>
                    <div className="flex items-center justify-center md:justify-start gap-4 pt-2">
                       <div className="flex items-center gap-2 text-white/40">
                          <Users size={14} />
                          <span className="text-[10px] font-heading uppercase tracking-widest">{membersInHouse.length} MEMBROS</span>
                       </div>
                    </div>
                  </div>

                  <div className="text-center md:text-right shrink-0">
                    <p className={`font-heading text-4xl ${colors.text} drop-shadow-2xl`}>{pts.toLocaleString()}</p>
                    <p className="text-[10px] text-white/40 font-heading uppercase tracking-[0.3em]">PONTOS TOTAIS</p>
                  </div>
                </div>

                {/* Magic Liquid Progress Bar */}
                <div className="mt-8 relative">
                   <div className="h-4 bg-black/40 rounded-full border border-white/5 p-1 overflow-hidden shadow-inner">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ease-out relative shadow-[0_0_20px_rgba(0,0,0,0.5)] ${
                          houseId === "gryffindor" ? "bg-gradient-to-r from-red-600 to-red-400" :
                          houseId === "slytherin"  ? "bg-gradient-to-r from-green-600 to-green-400" :
                          houseId === "ravenclaw"  ? "bg-gradient-to-r from-blue-600 to-blue-400" : "bg-gradient-to-r from-yellow-600 to-yellow-400"
                        }`}
                        style={{ width: `${pct}%` }}
                      >
                         {/* Shimmer */}
                         <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                      </div>
                   </div>
                   <div className="absolute top-1/2 -translate-y-1/2 right-0 pr-2 pointer-events-none">
                      <Sparkles size={12} className="text-white/20" />
                   </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
