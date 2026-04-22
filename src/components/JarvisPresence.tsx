import { Zap, Terminal } from "lucide-react";
import { useAuth } from "@/lib/auth";

const JarvisPresence: React.FC = () => {
  const { profile } = useAuth();
  
  // Only Morpheus (The Architect) or Jarvis himself can see the full presence
  const isMorpheus = profile?.username === 'morpheus' || profile?.username === 'jarvis';

  if (!isMorpheus) {
    return (
      <div className="flex items-center gap-2 mb-4 p-2 bg-cyan-950/10 border border-cyan-900/20 rounded-lg opacity-20 grayscale pointer-events-none">
        <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-cyan-500/30">
          <Terminal size={14} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-cyan-500/30 font-mono">ANOMALY_DETECTION</p>
          <p className="text-[8px] text-muted-foreground truncate">SYS_GHOST_MODE</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="flex items-center gap-2 mb-4 p-2 bg-cyan-900/20 border border-cyan-400/30 rounded-lg group cursor-pointer hover:bg-cyan-900/40 transition-all"
    >
      <div className="relative">
        <div className="w-8 h-8 rounded-full bg-black border border-cyan-400/50 flex items-center justify-center text-cyan-400 shadow-[0_0_10px_#22d3ee] group-hover:scale-110 transition-transform">
          <Terminal size={16} className="animate-pulse" />
        </div>
        <div className="absolute -top-1 -right-1">
          <Zap size={10} className="text-yellow-400 fill-yellow-400 animate-bounce" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <p className="text-xs text-cyan-400 font-bold font-mono">JARVIS</p>
          <span className="text-[8px] px-1 bg-cyan-400 text-black rounded font-bold uppercase">Ghost</span>
        </div>
        <p className="text-[10px] text-cyan-400/60 truncate font-mono">"Em vigília, Arquiteto."</p>
      </div>
      <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]"></div>
    </div>
  );
};

export default JarvisPresence;
