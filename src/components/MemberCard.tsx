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
import { House } from "@/lib/store";

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
        // Verificar se já existe um relacionamento antes de inserir
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
        // Aceitar pedido recebido
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
        // Remover amizade/cancelar pedido
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
      none:             { icon: <UserPlus size={14} />, label: "Adicionar",  cls: "bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20" },
      pending_sent:     { icon: <Clock size={14} />,    label: "Enviado",    cls: "bg-secondary text-muted-foreground border border-border" },
      pending_received: { icon: <UserCheck size={14} />, label: "Aceitar",   cls: "bg-green-500/10 text-green-400 border border-green-400/30 hover:bg-green-500/20" },
      accepted:         { icon: <UserCheck size={14} />, label: "Amigos",    cls: "bg-secondary text-muted-foreground border border-border hover:border-destructive/50" },
      blocked:          { icon: null, label: "Bloqueado", cls: "bg-destructive/10 text-destructive border border-destructive/30" },
    };
    const cfg = configs[status] || configs.none;
    return (
      <button
        onClick={handleFriendAction}
        disabled={loading || status === "blocked"}
        className={`flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-heading transition-all ${cfg.cls} disabled:opacity-50`}
      >
        {cfg.icon} {cfg.label}
      </button>
    );
  };

  if (compact) {
    return (
      <div
        onClick={goToProfile}
        className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-primary/40 hover:bg-white/[0.07] cursor-pointer transition-all group relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <div className="relative shrink-0">
          <div className="w-12 h-12 rounded-full p-0.5 bg-gradient-to-tr from-primary/30 to-transparent border border-white/10 shadow-lg transition-transform duration-500 group-hover:scale-110">
            <SafeImage 
              src={member.avatar_url || ""} 
              alt={member.full_name} 
              className="w-full h-full rounded-full object-cover" 
            />
          </div>
          {member.online !== undefined && (
            <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 ${member.online ? "bg-green-500 animate-pulse" : "bg-muted-foreground/40"}`} />
          )}
        </div>
        <div className="flex-1 min-w-0 relative z-10">
          <p className="font-heading text-sm text-white truncate group-hover:text-primary transition-colors tracking-tight">{member.full_name}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest opacity-60">Nv. {member.level || 1} · @{member.username}</p>
        </div>
        <div className="relative z-10">
           {member.house && <HouseCrest house={member.house as House} size="sm" />}
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={goToProfile}
      className="relative overflow-hidden rounded-[2rem] bg-gradient-to-b from-white/[0.07] to-black/40 backdrop-blur-xl p-6 border border-white/10 hover:border-primary/50 hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(0,0,0,0.6)] transition-all duration-500 cursor-pointer group"
    >
      {/* Ambient Glow */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity" />
      
      {/* Avatar Section */}
      <div className="flex flex-col items-center text-center mb-5 relative z-10">
        <div className="relative mb-4">
          <div className={`w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-primary/40 via-white/10 to-primary/40 shadow-xl transition-transform duration-700 group-hover:scale-110`}>
             <div className="absolute inset-0 rounded-full bg-black/20 shadow-inner" />
             <div className="w-full h-full rounded-full bg-slate-900 overflow-hidden relative border border-white/5">
                <SafeImage
                  src={member.avatar_url || ""}
                  alt={member.full_name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                {/* Glass overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-30" />
             </div>
          </div>
          {member.online !== undefined && (
            <span className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-slate-900 shadow-lg ${member.online ? "bg-green-500 animate-pulse" : "bg-muted-foreground/40"}`} />
          )}
        </div>

        <div className="space-y-1">
          <h3 className="font-heading text-lg text-white group-hover:text-primary transition-colors truncate w-full tracking-tight">{member.full_name}</h3>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest opacity-60">@{member.username}</p>
        </div>

        <div className="flex items-center justify-center gap-3 mt-4">
          <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10 flex items-center gap-2">
            {member.house && <HouseCrest house={member.house as House} size="sm" />}
            <span className="text-[10px] text-primary font-heading uppercase tracking-tighter">Nv. {member.level || 1}</span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      {!isMe && (
        <div className="flex gap-2 justify-center relative z-10" onClick={e => e.stopPropagation()}>
          {friendBtn()}
          <button
            onClick={goToDM}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-heading bg-white/5 text-white/80 border border-white/10 hover:bg-white/10 hover:border-primary/50 hover:text-primary transition-all uppercase tracking-widest shadow-lg"
          >
            <MessageCircle size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
