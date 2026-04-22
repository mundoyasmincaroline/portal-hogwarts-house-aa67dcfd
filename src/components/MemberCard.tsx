/**
 * MemberCard — card clicável de membro usado em todo o portal.
 * Ao clicar: navega para o perfil.
 * Mostra foto, nome, casa, nível e botões de ação (amizade + DM).
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import HouseCrest from "@/components/HouseCrest";
import SafeImage from "@/components/SafeImage";
import { MessageCircle, UserPlus, UserCheck, Clock } from "lucide-react";
import { House } from "@/lib/storinterface Props {
  member: {
    user_id: string;
    full_name: string;
    username?: string;
    avatar_url?: string | null;
    house?: string;
    level?: number;
    xp?: number;
    online?: boolean;
    vip_plan?: string | null;
  };
  friendshipStatus?: "none" | "pending_sent" | "pending_received" | "accepted" | "blocked";
  onFriendshipChange?: () => void;
  compact?: boolean;
}

export default function MemberCard({ member, friendshipStatus = "none", onFriendshipChange, compact = false }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState(friendshipStatus);
  const [loading, setLoading] = useState(false);

  const isMe = user?.id === member.user_id;
  const isVip = member.vip_plan === 'vip' || member.vip_plan === 'founder' || member.vip_plan === 'premium';
  const isFounder = member.vip_plan === 'founder';

  const goToProfile = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/dashboard/profile/${member.user_id}`);
  };

  const goToDM = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    navigate(`/dashboard/dm/${member.user_id}`);
  };

  const handleFriendAction = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || isMe || loading) return;
    setLoading(true);

    try {
      if (status === "none") {
        const { data: existing } = await supabase
          .from("friendships")
          .select("id, status")
          .or(`and(user_id.eq.${user.id},friend_id.eq.${member.user_id}),and(user_id.eq.${member.user_id},friend_id.eq.${user.id})`)
          .maybeSingle();

        if (existing) {
          toast.info("Já existe um relacionamento com este membro.");
          setStatus(existing.status === "accepted" ? "accepted" : "pending_sent");
        } else {
          const { error } = await supabase.from("friendships").insert({
            user_id: user.id,
            friend_id: member.user_id,
            status: "pending",
          } as never);
          if (error) throw error;
          setStatus("pending_sent");
          toast.success("Convite de amizade enviado! ✨");
        }
      } else if (status === "pending_received") {
        const { data: fr } = await supabase
          .from("friendships")
          .select("id")
          .eq("user_id", member.user_id)
          .eq("friend_id", user.id)
          .eq("status", "pending")
          .maybeSingle();
        if (fr) {
          const { error } = await supabase.from("friendships").update({ status: "accepted" }).eq("id", fr.id);
          if (error) throw error;
          setStatus("accepted");
          toast.success("Amizade aceita! 🎉");
        }
      } else if (status === "accepted" || status === "pending_sent") {
        await supabase
          .from("friendships")
          .delete()
          .or(`and(user_id.eq.${user.id},friend_id.eq.${member.user_id}),and(user_id.eq.${member.user_id},friend_id.eq.${user.id})`);
        setStatus("none");
        toast.success(status === "accepted" ? "Amizade desfeita." : "Pedido cancelado.");
      }
      onFriendshipChange?.();
    } catch (err: any) {
      toast.error("Erro: " + (err.message || "Tente novamente."));
    } finally {
      setLoading(false);
    }
  };

  const friendBtn = () => {
    if (isMe) return null;
    const configs = {
      none:             { icon: <UserPlus size={12} />, label: "Adicionar",  cls: "bg-primary/20 text-primary border-primary/40 hover:bg-primary/40" },
      pending_sent:     { icon: <Clock size={12} />,    label: "Enviado",    cls: "bg-zinc-800 text-zinc-500 border-zinc-700" },
      pending_received: { icon: <UserCheck size={12} />, label: "Aceitar",   cls: "bg-green-500/20 text-green-400 border-green-500/40 hover:bg-green-500/40" },
      accepted:         { icon: <UserCheck size={12} />, label: "Amigos",    cls: "bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-red-500/50 hover:text-red-400" },
      blocked:          { icon: null, label: "Bloqueado", cls: "bg-red-500/20 text-red-400 border-red-500/40" },
    };
    const cfg = configs[status] || configs.none;
    return (
      <button
        onClick={handleFriendAction}
        disabled={loading || status === "blocked"}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-heading uppercase tracking-widest border transition-all ${cfg.cls} disabled:opacity-50`}
      >
        {cfg.icon} {cfg.label}
      </button>
    );
  };

  if (compact) {
    return (
      <div
        onClick={goToProfile}
        className="flex items-center gap-3 p-4 rounded-2xl glass border border-white/10 hover:border-primary/40 hover:bg-white/5 cursor-pointer transition-all group relative overflow-hidden"
      >
        {isVip && <div className="absolute inset-0 bg-yellow-500/5 pointer-events-none" />}
        <div className="relative shrink-0">
          <div className="w-12 h-12 shrink-0 relative">
             {isVip && <div className="absolute inset-0 bg-yellow-500/20 rounded-full blur-md animate-pulse" />}
             <SafeImage 
                src={member.avatar_url || ""} 
                alt={member.full_name} 
                className={`w-full h-full rounded-full object-cover border-2 transition-all relative z-10 ${isVip ? "border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.3)]" : "border-white/10"}`} 
              />
          </div>
          {member.online !== undefined && (
            <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-4 border-zinc-900 z-20 ${member.online ? "bg-green-500" : "bg-zinc-600"}`} />
          )}
        </div>
        <div className="flex-1 min-w-0 relative z-10">
          <div className="flex items-center gap-2">
            <p className="font-heading text-sm text-white truncate group-hover:text-primary transition-colors">{member.full_name}</p>
            {isFounder && <Crown size={12} className="text-yellow-400 shrink-0" />}
          </div>
          <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-tighter">@{member.username} · Lv.{member.level || 1}</p>
        </div>
        {member.house && <HouseCrest house={member.house as House} size="xs" />}
      </div>
    );
  }

  return (
    <div
      onClick={goToProfile}
      className={`relative glass rounded-[2.5rem] p-6 border-2 transition-all duration-500 cursor-pointer group flex flex-col items-center text-center ${
        isVip 
          ? "border-yellow-500/40 bg-gradient-to-br from-yellow-950/20 to-black shadow-[0_20px_50px_rgba(250,204,21,0.1)] hover:border-yellow-400" 
          : "border-white/10 bg-black/40 hover:border-white/30 hover:-translate-y-2 shadow-2xl"
      }`}
    >
      {/* VIP Aura */}
      {isVip && (
        <div className="absolute inset-0 bg-yellow-500/5 rounded-[2.5rem] pointer-events-none animate-pulse-glow" />
      )}

      {/* Avatar Section */}
      <div className="relative mb-6">
        <div className="relative w-24 h-24 shrink-0">
          {isVip && (
            <div className="absolute inset-0 bg-yellow-400/20 rounded-full blur-2xl animate-pulse scale-125" />
          )}
          <SafeImage
            src={member.avatar_url || ""}
            alt={member.full_name}
            className={`w-full h-full rounded-full object-cover border-2 transition-all relative z-10 ${
              isVip ? "border-yellow-400 shadow-2xl" : "border-white/10 group-hover:border-white/40"
            }`}
          />
          {member.online !== undefined && (
            <span className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-4 border-zinc-900 z-20 ${member.online ? "bg-green-500" : "bg-zinc-600"}`} />
          )}
        </div>
        
        {/* Floating Badges */}
        <div className="absolute -top-2 -right-2 z-30">
          {isFounder ? (
            <div className="bg-yellow-400 text-black px-2 py-0.5 rounded-lg text-[8px] font-heading font-bold shadow-xl">FUNDADOR</div>
          ) : isVip ? (
            <div className="bg-primary text-primary-foreground px-2 py-0.5 rounded-lg text-[8px] font-heading font-bold shadow-xl">VIP Bruxo</div>
          ) : null}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-1 mb-6 w-full px-2">
        <h3 className={`font-heading text-lg truncate w-full transition-colors ${isVip ? "text-yellow-100" : "text-white group-hover:text-primary"}`}>
          {member.full_name}
        </h3>
        <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-[0.2em]">@{member.username}</p>
        
        <div className="flex items-center justify-center gap-3 pt-3">
          <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-1 flex items-center gap-2">
            {member.house && <HouseCrest house={member.house as House} size="xs" />}
            <span className={`text-[10px] font-heading uppercase font-bold ${isVip ? "text-yellow-400" : "text-primary"}`}>Nv. {member.level || 1}</span>
          </div>
        </div>
      </div>

      {/* Action buttons (Fixed layout to prevent break) */}
      {!isMe && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full mt-auto" onClick={e => e.stopPropagation()}>
          <div className="flex justify-center">{friendBtn()}</div>
          <button
            onClick={goToDM}
            className="flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl text-[9px] font-heading uppercase tracking-widest bg-white/5 border border-white/10 text-white/60 hover:border-primary/50 hover:text-white transition-all"
          >
            <MessageSquare size={12} /> DM
          </button>
        </div>
      )}
    </div>
  );
 </div>
  );
}
