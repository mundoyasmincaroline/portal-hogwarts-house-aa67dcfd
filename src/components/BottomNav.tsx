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
    <nav className="md:hidden fixed bottom-6 left-4 right-4 z-[100]">
      <div className="glass !bg-card/80 backdrop-blur-3xl border border-white/10 rounded-2xl px-1 h-16 flex items-center justify-around shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-10 duration-1000">
        {MOBILE_NAV.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`relative flex flex-col items-center justify-center gap-1 w-14 h-14 transition-all duration-300 ${
                isActive ? "text-primary scale-110" : "text-muted-foreground/60 active:scale-90"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-active"
                  className="absolute -top-1 w-1 h-1 bg-primary rounded-full shadow-[0_0_10px_rgba(212,175,55,1)]"
                />
              )}
              <div className={`transition-transform duration-300 ${isActive ? "drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]" : ""}`}>
                {item.icon}
              </div>
              <span className={`text-[8px] uppercase tracking-widest font-black transition-opacity duration-300 ${isActive ? "opacity-100" : "opacity-0"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
