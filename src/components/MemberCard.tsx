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
        className="flex items-center gap-3 p-3 rounded-xl glass border border-border/50 hover:border-primary/40 cursor-pointer transition-all group"
      >
        <div className="relative shrink-0">
          {member.avatar_url ? (
            <img src={member.avatar_url} alt={member.full_name} className="w-10 h-10 rounded-full object-cover border border-border group-hover:border-primary/50 transition-colors" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-heading text-sm border border-border">
              {member.full_name?.[0] || "?"}
            </div>
          )}
          {member.online !== undefined && (
            <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-card ${member.online ? "bg-green-500" : "bg-muted-foreground/40"}`} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-heading text-sm text-foreground truncate group-hover:text-primary transition-colors">{member.full_name}</p>
          <p className="text-[11px] text-muted-foreground">@{member.username} · Nv.{member.level || 1}</p>
        </div>
        {member.house && <HouseCrest house={member.house as House} size="sm" />}
      </div>
    );
  }

  return (
    <div
      onClick={goToProfile}
      className="glass rounded-2xl p-5 border border-border/50 hover:border-primary/50 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(212,175,55,0.15)] transition-all cursor-pointer group"
    >
      {/* Avatar */}
      <div className="flex flex-col items-center text-center mb-4">
        <div className="relative mb-3">
          {member.avatar_url ? (
            <img
              src={member.avatar_url}
              alt={member.full_name}
              className="w-20 h-20 rounded-full object-cover border-2 border-border group-hover:border-primary/60 transition-colors"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center font-heading text-2xl border-2 border-border group-hover:border-primary/60 transition-colors">
              {member.full_name?.[0] || "?"}
            </div>
          )}
          {member.online !== undefined && (
            <span className={`absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full border-2 border-card ${member.online ? "bg-green-500" : "bg-muted-foreground/40"}`} />
          )}
        </div>

        <h3 className="font-heading text-base text-foreground group-hover:text-primary transition-colors truncate w-full">{member.full_name}</h3>
        <p className="text-xs text-muted-foreground">@{member.username}</p>

        <div className="flex items-center gap-2 mt-1">
          {member.house && <HouseCrest house={member.house as House} size="sm" />}
          <span className="text-xs text-primary font-heading">Nv. {member.level || 1}</span>
        </div>
      </div>

      {/* Action buttons */}
      {!isMe && (
        <div className="flex gap-2 justify-center" onClick={e => e.stopPropagation()}>
          {friendBtn()}
          <button
            onClick={goToDM}
            className="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-heading bg-secondary text-muted-foreground border border-border hover:border-primary/50 hover:text-primary transition-all"
          >
            <MessageCircle size={14} /> Mensagem
          </button>
        </div>
      )}
    </div>
  );
}
