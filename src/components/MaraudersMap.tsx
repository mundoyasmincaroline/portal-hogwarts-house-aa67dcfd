import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, Map as MapIcon, Castle, BookOpen, User, ShoppingBag, Trophy, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import MagicalIcon from "@/components/shared/MagicalIcon";
import MagicalEmoji from "@/components/shared/MagicalEmoji";
import SafeImage from "./SafeImage";

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
      <div className="relative w-full max-w-6xl aspect-[16/10] bg-[#f4e4bc] rounded-[3rem] shadow-[0_0_150px_rgba(0,0,0,0.9)] overflow-hidden border-[16px] border-[#2a1d15] p-0 group">
        {/* Hogwarts Blueprint Background */}
        <div className="absolute inset-0 z-0">
           <img 
             src="https://images.unsplash.com/photo-1547756536-cde3673fa2e5?auto=format&fit=crop&q=80&w=2000" 
             className="w-full h-full object-cover opacity-20 grayscale" 
             alt="Hogwarts Map"
           />
           <div className="absolute inset-0 bg-[#f4e4bc]/60 mix-blend-overlay" />
        </div>

        {/* Paper Texture Overlay */}
        <div className="absolute inset-0 z-10 opacity-60 mix-blend-multiply pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/old-map.png')]" />
        
        {/* Ink Drawings / Decor */}
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none select-none">
            <h1 className="font-heading text-8xl text-[#3d2b1f]/10 rotate-[-5deg]">I solemnly swear</h1>
            <h2 className="font-heading text-6xl text-[#3d2b1f]/10 rotate-[3deg] mt-[-20px]">that I am up to no good</h2>
            
            {/* Compass Rose */}
            <div className="absolute top-10 left-10 w-32 h-32 opacity-20 rotate-45 border-4 border-[#3d2b1f] flex items-center justify-center">
              <div className="w-full h-px bg-[#3d2b1f]" />
              <div className="h-full w-px bg-[#3d2b1f] absolute" />
              <span className="absolute -top-6 font-heading text-lg">N</span>
            </div>
        </div>

        {/* Close Button */}
        <button 
            onClick={onClose}
            className="absolute top-6 right-6 z-30 p-3 bg-[#3d2b1f] text-[#f4e4bc] rounded-full hover:scale-110 transition-transform"
        >
            <X size={24} />
        </button>

        {/* Locations */}
        <div className="relative z-20 w-full h-full">
            {MAP_LOCATIONS.map((loc) => (
                <div 
                    key={loc.id}
                    className="absolute -translate-x-1/2 -translate-y-1/2"
                    style={{ left: loc.x, top: loc.y }}
                >
                    <button
                        onMouseEnter={() => setActiveLoc(loc.id)}
                        onMouseLeave={() => setActiveLoc(null)}
                        onClick={() => {
                            navigate(loc.path);
                            onClose();
                        }}
                        className="relative flex flex-col items-center gap-2 transition-all duration-300 hover:scale-110 active:scale-95"
                    >
                        {/* Animated Name Tag */}
                        <div className={`px-4 py-1 rounded-sm border-2 border-[#3d2b1f] bg-[#f4e4bc] shadow-md transition-all duration-500 ${activeLoc === loc.id ? 'opacity-100 translate-y-0' : 'opacity-80 translate-y-1'}`}>
                          <span className="font-heading text-[10px] text-[#3d2b1f] uppercase tracking-[0.2em]">{loc.name}</span>
                        </div>

                        {/* The Plaque */}
                        <div className="relative">
                          <MagicalIcon size="md" color="#3d2b1f">
                            <MagicalEmoji icon={loc.icon.type} size="sm" className="bg-transparent border-none shadow-none grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100" />
                          </MagicalIcon>
                          
                          {/* Footprints following the location */}
                          {activeLoc === loc.id && (
                              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex gap-4 animate-footprints-fast">
                                  <span className="text-[#3d2b1f] text-xl rotate-12">👣</span>
                                  <span className="text-[#3d2b1f] text-xl -rotate-12 mt-2">👣</span>
                              </div>
                          )}
                        </div>
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
