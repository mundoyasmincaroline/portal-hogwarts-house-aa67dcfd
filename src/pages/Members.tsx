import { useState, useEffect } from "react";
import { useAuth, isUserOnline } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import MemberCard from "@/components/MemberCard";
import { Search, Users } from "lucide-react";
import { House } from "@/types";

interface Member {
  user_id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  house: string;
  level: number;
  xp: number;
  last_seen?: string;
  online?: boolean;
}

type FriendshipStatus = "none" | "pending_sent" | "pending_received" | "accepted" | "blocked";

export default function Members() {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [filtered, setFiltered] = useState<Member[]>([]);
  const [friendships, setFriendships] = useState<Record<string, FriendshipStatus>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [houseFilter, setHouseFilter] = useState<string>("all");

  useEffect(() => {
    loadMembers();
  }, [user?.id]);

  useEffect(() => {
    let result = members;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(m =>
        m.full_name.toLowerCase().includes(q) ||
        m.username?.toLowerCase().includes(q)
      );
    }
    if (houseFilter !== "all") {
      result = result.filter(m => m.house === houseFilter);
    }
    setFiltered(result);
  }, [search, houseFilter, members]);

  const loadMembers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("user_id, full_name, username, avatar_url, house, level, xp, last_seen")
      .eq("approved", true)
      .order("level", { ascending: false });

    if (data) {
      const withOnline = data.map(m => ({ ...m, online: isUserOnline(m) }));
      setMembers(withOnline);
      setFiltered(withOnline);
    }

    // Load all friendships involving current user
    if (user) {
      const { data: fData } = await supabase
        .from("friendships")
        .select("user_id, friend_id, status")
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

      if (fData) {
        const map: Record<string, FriendshipStatus> = {};
        fData.forEach(f => {
          const otherId = f.user_id === user.id ? f.friend_id : f.user_id;
          if (f.status === "accepted") map[otherId] = "accepted";
          else if (f.status === "blocked") map[otherId] = "blocked";
          else if (f.status === "pending") {
            map[otherId] = f.user_id === user.id ? "pending_sent" : "pending_received";
          }
        });
        setFriendships(map);
      }
    }

    setLoading(false);
  };

  const onlineMembers = filtered.filter(m => m.online);
  const offlineMembers = filtered.filter(m => !m.online);

  const HOUSES = [
    { id: "gryffindor", label: "🦁 Grifinória" },
    { id: "slytherin",  label: "🐍 Sonserina" },
    { id: "ravenclaw",  label: "🦅 Corvinal" },
    { id: "hufflepuff", label: "🦡 Lufa-Lufa" },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10 px-2 sm:px-0">
      {/* Header */}
      <div className="glass rounded-2xl sm:rounded-3xl p-6 sm:p-8 relative overflow-hidden border border-primary/20">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618944847823-72c1cce8a8e1?q=80&w=2070')] bg-cover bg-center opacity-10" />
        <div className="relative z-10">
          <h1 className="font-heading text-4xl text-gold-gradient flex items-center gap-3">
            <Users size={36} /> Membros do Portal
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            {members.length} bruxos registrados · {onlineMembers.length} online agora
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar membro..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-secondary/50"
          />
        </div>
        <div className="flex gap-1.5 sm:gap-2 flex-wrap">
          <button
            onClick={() => setHouseFilter("all")}
            className={`px-3 py-2 rounded-full text-[10px] sm:text-xs font-heading transition-all border ${houseFilter === "all" ? "bg-primary/20 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}
          >
            Todas
          </button>
          {HOUSES.map(h => (
            <button
              key={h.id}
              onClick={() => setHouseFilter(houseFilter === h.id ? "all" : h.id)}
              className={`px-3 py-2 rounded-full text-[10px] sm:text-xs font-heading transition-all border ${houseFilter === h.id ? "bg-primary/20 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}
            >
              {h.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-muted-foreground animate-pulse">Convocando os bruxos...</div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-muted-foreground">Nenhum membro encontrado.</p>
        </div>
      ) : (
        <>
          {/* Online agora */}
          {onlineMembers.length > 0 && (
            <div>
              <h2 className="font-heading text-lg text-green-400 flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block animate-pulse" />
                Online agora ({onlineMembers.length})
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {onlineMembers.map(m => (
                  <MemberCard
                    key={m.user_id}
                    member={m}
                    friendshipStatus={friendships[m.user_id] || "none"}
                    onFriendshipChange={loadMembers}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Todos os membros */}
          {offlineMembers.length > 0 && (
            <div>
              <h2 className="font-heading text-lg text-muted-foreground flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-muted-foreground/40 inline-block" />
                {onlineMembers.length > 0 ? "Outros membros" : "Todos os membros"} ({offlineMembers.length})
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {offlineMembers.map(m => (
                  <MemberCard
                    key={m.user_id}
                    member={m}
                    friendshipStatus={friendships[m.user_id] || "none"}
                    onFriendshipChange={loadMembers}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
