/**
 * MemberCard — card clicável de membro usado em todo o portal.
 * Ao clicar: navega para o perfil.
 * Mostra foto, nome, casa, nível e botões de ação (amizade + DM).
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import HouseCrest from "@/components/HouseCrest";
import SafeImage from "@/components/SafeImage";
import { MessageCircle, UserPlus, UserCheck, Clock, MessageSquare, Crown } from "lucide-react";
import { House } from "@/types";

interface Props {
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
        className={`flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-2 rounded-2xl text-[8px] sm:text-[9px] font-heading uppercase tracking-widest border transition-all duration-300 active:scale-90 ${cfg.cls} disabled:opacity-50 shadow-md hover:shadow-lg`}
      >
        {cfg.icon} {cfg.label}
      </button>

    );
  };

  if (compact) {
    return (
      <motion.div
        onClick={goToProfile}
        whileHover={{ x: 5, backgroundColor: "rgba(255, 255, 255, 0.05)" }}
        className="flex items-center gap-3 p-4 rounded-2xl glass border border-white/5 hover:border-primary/40 cursor-pointer transition-all group relative overflow-hidden"
      >
        {isVip && <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 to-transparent pointer-events-none" />}
        <div className="relative shrink-0">
          <div className="w-12 h-12 shrink-0 relative">
             {isVip && <div className="absolute inset-0 bg-yellow-500/20 rounded-full blur-md animate-pulse" />}
             <SafeImage 
                src={member.avatar_url || ""} 
                alt={member.full_name} 
                className={`w-full h-full rounded-full object-cover border-2 transition-all relative z-10 ${isVip ? "border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.3)]" : "border-white/10 group-hover:border-primary/50"}`} 
              />
          </div>
          {member.online !== undefined && (
            <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-4 border-card z-20 ${member.online ? "bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]" : "bg-zinc-600"}`} />
          )}
        </div>
        <div className="flex-1 min-w-0 relative z-10">
          <div className="flex items-center gap-2">
            <p className="font-heading text-xs sm:text-sm text-white truncate group-hover:text-primary transition-colors">{member.full_name}</p>
            {isFounder && <Crown size={12} className="text-yellow-400 shrink-0" />}
          </div>
          <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-tight opacity-60">@{member.username} · Lv.{member.level || 1}</p>
        </div>
        <div className="shrink-0 opacity-40 group-hover:opacity-100 group-hover:scale-110 transition-all">
          {member.house && <HouseCrest house={member.house as House} size="xs" />}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      onClick={goToProfile}
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`relative glass rounded-2xl sm:rounded-[2rem] p-4 sm:p-6 border transition-all duration-500 cursor-pointer group flex flex-col items-center text-center overflow-hidden ${
        isVip 
          ? "border-primary/40 bg-gradient-to-br from-primary/10 via-card to-black shadow-[0_20px_50px_rgba(250,204,21,0.15)] hover:border-primary" 
          : "border-white/5 bg-card/60 hover:border-primary/30 shadow-2xl"
      }`}
    >
      {/* Decorative magical aura for VIPs */}
      {isVip && (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(250,204,21,0.1),transparent_70%)] pointer-events-none" />
      )}

      {/* House watermark in background */}
      {member.house && (
        <div className="absolute -right-4 -bottom-4 opacity-[0.03] rotate-12 group-hover:scale-110 group-hover:opacity-[0.06] transition-all duration-700 pointer-events-none">
          <HouseCrest house={member.house as House} size="lg" />
        </div>
      )}

      {/* Avatar Section */}
      <div className="relative mb-6">
        <div className="relative w-20 h-20 sm:w-28 sm:h-28 shrink-0">
          {isVip && (
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-1 rounded-full bg-gradient-to-r from-yellow-400 via-amber-200 to-yellow-600 opacity-30 blur-sm"
            />
          )}
          <div className="relative w-full h-full rounded-full overflow-hidden border-2 border-white/10 group-hover:border-primary/50 transition-colors z-10">
            <SafeImage
              src={member.avatar_url || ""}
              alt={member.full_name}
              className="w-full h-full object-cover"
            />
          </div>
          {member.online !== undefined && (
            <span className={`absolute bottom-2 right-2 w-5 h-5 rounded-full border-4 border-card z-20 ${member.online ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" : "bg-zinc-600"}`} />
          )}
        </div>
        
        {/* Floating Badges */}
        <div className="absolute -top-1 -right-1 z-30 flex flex-col gap-1">
          {isFounder ? (
            <span className="bg-yellow-400 text-black px-2 py-0.5 rounded-lg text-[8px] font-heading font-bold shadow-lg border border-yellow-200">FUNDADOR</span>
          ) : isVip ? (
            <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded-lg text-[8px] font-heading font-bold shadow-lg">VIP</span>
          ) : null}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-1 mb-6 w-full relative z-10">
        <h3 className={`font-heading text-lg sm:text-xl truncate w-full transition-colors ${isVip ? "text-yellow-100 group-hover:text-yellow-400" : "text-white group-hover:text-primary"}`}>
          {member.full_name}
        </h3>
        <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-[0.2em] opacity-60">@{member.username}</p>
        
        <div className="flex items-center justify-center gap-2 pt-4">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-full px-4 py-1.5 flex items-center gap-2 group-hover:border-primary/20 transition-colors">
            {member.house && <HouseCrest house={member.house as House} size="xs" />}
            <span className={`text-[11px] font-heading uppercase font-bold tracking-wider ${isVip ? "text-yellow-400" : "text-primary/80"}`}>Nível {member.level || 1}</span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      {!isMe && (
        <div className="grid grid-cols-2 gap-2 sm:gap-3 w-full mt-auto relative z-10" onClick={e => e.stopPropagation()}>
          <div className="flex justify-stretch w-full">{friendBtn()}</div>
          <button
            onClick={goToDM}
            className="btn-magical flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-2xl text-[9px] sm:text-[10px] font-heading uppercase tracking-widest bg-white/5 border border-white/10 text-white/60 hover:border-primary/40 hover:text-white transition-all active:scale-90 shadow-md hover:shadow-lg"
          >
            <MessageSquare size={14} /> DM
          </button>

        </div>
      )}
    </motion.div>
  );
}
