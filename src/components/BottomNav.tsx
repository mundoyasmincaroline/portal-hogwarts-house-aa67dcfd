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
    <nav className="md:hidden fixed bottom-4 left-3 right-3 z-[100] pb-safe">
      <div className="bg-gradient-to-b from-[#1a0f05]/95 to-[#0a0604]/98 backdrop-blur-3xl border border-primary/30 rounded-[2rem] px-2 h-[68px] flex items-center justify-around shadow-[0_20px_60px_rgba(0,0,0,0.85),0_0_30px_rgba(212,175,55,0.08)] animate-in slide-in-from-bottom-10 duration-1000">
        {MOBILE_NAV.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              aria-label={item.label}
              className={`relative flex flex-col items-center justify-center gap-0.5 min-w-[56px] h-14 rounded-2xl transition-all duration-300 ${
                isActive ? "text-primary scale-105 bg-primary/10" : "text-foreground/70 active:scale-90 hover:text-primary/90"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-active"
                  className="absolute -top-1 w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_10px_rgba(212,175,55,1)]"
                />
              )}
              <div className={`transition-transform duration-300 ${isActive ? "drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]" : ""}`}>
                {item.icon}
              </div>
              <span className={`text-[9px] uppercase tracking-wider font-black transition-opacity duration-300 ${isActive ? "opacity-100" : "opacity-70"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
