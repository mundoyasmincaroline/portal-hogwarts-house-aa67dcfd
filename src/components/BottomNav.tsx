import { Home, MessageSquare, Trophy, ShoppingBag, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

const MOBILE_NAV = [
  { icon: <Home size={20} />, label: "Início", path: "/dashboard" },
  { icon: <MessageSquare size={20} />, label: "Chat", path: "/dashboard/chats" },
  { icon: <Trophy size={20} />, label: "Ranking", path: "/dashboard/ranking" },
  { icon: <ShoppingBag size={20} />, label: "Loja", path: "/dashboard/store" },
  { icon: <User size={20} />, label: "Perfil", path: "/dashboard/profile" },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-2xl border-t border-white/10 px-2 pb-safe-offset-1 pt-2 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
      <div className="flex items-center justify-around">
        {MOBILE_NAV.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`relative flex flex-col items-center gap-1 p-2 transition-all duration-300 ${
                isActive ? "text-primary" : "text-muted-foreground/60 hover:text-foreground"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-active"
                  className="absolute -top-2 w-12 h-1 bg-primary rounded-full shadow-[0_0_10px_rgba(212,175,55,0.5)]"
                />
              )}
              <div className={`transition-transform duration-300 ${isActive ? "scale-110 -translate-y-1" : ""}`}>
                {item.icon}
              </div>
              <span className="text-[9px] font-heading font-bold uppercase tracking-tighter">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
