import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, Map as MapIcon, Castle, BookOpen, User, ShoppingBag, Trophy, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const MAP_LOCATIONS = [
  { id: "castle", name: "O Castelo", path: "/dashboard", x: "50%", y: "45%", icon: <Castle /> },
  { id: "guide", name: "Guia do Maroto", path: "/dashboard/guide", x: "30%", y: "30%", icon: <BookOpen /> },
  { id: "profile", name: "Meu Perfil", path: "/dashboard/profile", x: "70%", y: "30%", icon: <User /> },
  { id: "store", name: "Gringotts", path: "/dashboard/store", x: "25%", y: "65%", icon: <ShoppingBag /> },
  { id: "events", name: "Eventos Mágicos", path: "/dashboard/events", x: "75%", y: "65%", icon: <Trophy /> },
  { id: "chats", name: "Salas de RPG", path: "/dashboard/chats", x: "50%", y: "15%", icon: <MessageCircle /> },
];

export default function MaraudersMap({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const [activeLoc, setActiveLoc] = useState<string | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-md animate-in fade-in duration-500">
      <div className="relative w-full max-w-5xl aspect-[16/10] bg-[#f4e4bc] rounded-lg shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden border-[12px] border-[#3d2b1f] p-4">
        {/* Paper Texture Overlay */}
        <div className="absolute inset-0 opacity-40 mix-blend-multiply pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/old-map.png')]" />
        
        {/* Ink Drawings / Decor */}
        <div className="absolute inset-0 flex flex-col items-center justify-center opacity-20 pointer-events-none">
            <h1 className="font-heading text-8xl text-[#3d2b1f] rotate-[-5deg]">I solemnly swear</h1>
            <h2 className="font-heading text-6xl text-[#3d2b1f] rotate-[3deg] mt-[-20px]">that I am up to no good</h2>
        </div>

        {/* Close Button */}
        <button 
            onClick={onClose}
            className="absolute top-6 right-6 z-30 p-3 bg-[#3d2b1f] text-[#f4e4bc] rounded-full hover:scale-110 transition-transform"
        >
            <X size={24} />
        </button>

        {/* Locations */}
        <div className="relative w-full h-full">
            {MAP_LOCATIONS.map((loc) => (
                <div 
                    key={loc.id}
                    className="absolute -translate-x-1/2 -translate-y-1/2 group"
                    style={{ left: loc.x, top: loc.y }}
                >
                    <button
                        onMouseEnter={() => setActiveLoc(loc.id)}
                        onMouseLeave={() => setActiveLoc(null)}
                        onClick={() => {
                            navigate(loc.path);
                            onClose();
                        }}
                        className="relative flex flex-col items-center gap-3 transition-all duration-300 group-hover:scale-125"
                    >
                        {/* Pegadinhas Animação */}
                        {activeLoc === loc.id && (
                            <div className="absolute -bottom-8 flex gap-4 animate-bounce">
                                <span className="text-[#3d2b1f] text-xl rotate-12">👣</span>
                                <span className="text-[#3d2b1f] text-xl -rotate-12 mt-2">👣</span>
                            </div>
                        )}
                        
                        <div className="w-16 h-16 rounded-full bg-[#3d2b1f]/10 border-2 border-[#3d2b1f]/40 flex items-center justify-center text-[#3d2b1f] group-hover:bg-[#3d2b1f] group-hover:text-[#f4e4bc] shadow-lg">
                            {loc.icon}
                        </div>
                        <span className="font-heading text-sm text-[#3d2b1f] bg-[#f4e4bc]/80 px-3 py-1 rounded-full border border-[#3d2b1f]/20">
                            {loc.name}
                        </span>
                    </button>
                </div>
            ))}
        </div>

        {/* Footprints random animation */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
            {[...Array(6)].map((_, i) => (
                <div 
                    key={i}
                    className="absolute text-2xl animate-footprints text-[#3d2b1f]"
                    style={{ 
                        top: `${20 + Math.random() * 60}%`, 
                        left: `${20 + Math.random() * 60}%`,
                        animationDelay: `${i * 2}s`
                    }}
                >
                    👣
                </div>
            ))}
        </div>
      </div>

      <style>{`
        @keyframes footprints {
            0% { opacity: 0; transform: translate(0,0) rotate(0deg); }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { opacity: 0; transform: translate(100px, 50px) rotate(20deg); }
        }
        .animate-footprints {
            animation: footprints 10s infinite linear;
        }
      `}</style>
    </div>
  );
}
