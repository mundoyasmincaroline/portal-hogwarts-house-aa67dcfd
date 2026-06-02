import { useAuth } from "@/lib/auth";
import DynamicGreeting from "./DynamicGreeting";
import StoriesBar from "@/components/feed/StoriesBar";
import MagicalMemories from "@/components/MagicalMemories";
import BirthdayBanner from "@/components/BirthdayBanner";
import VipUpsellBanner from "@/components/VipUpsellBanner";
import DailyHighlight from "@/components/DailyHighlight";
import MoodSession from "@/components/MoodSession";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import DailyProphetTicker from "@/components/shared/DailyProphetTicker";
import HouseCupWidget from "@/components/rpg/HouseCupWidget";

export default function MagicalDashboardHeader() {
  const { profile } = useAuth();
  const [isExpanded, setIsExpanded] = useState(true); // Default to expanded for immediate impact, user can collapse if they want

  return (
    <div className="space-y-6 w-full max-w-4xl mx-auto animate-in fade-in duration-1000">
      {/* Real-time Section */}
      <div className="space-y-4">
        <DailyProphetTicker />
        <StoriesBar />
      </div>

      {/* Greeting & Main Stats */}
      <div className="space-y-4">
        <DynamicGreeting />
        <HouseCupWidget />
      </div>
      
      {/* Interactive Utilities */}
      <div className="relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 mb-4">
          <div className="flex flex-col">
            <h3 className="text-[10px] font-heading font-black uppercase tracking-[0.4em] text-primary/85 flex items-center gap-2">
              <Sparkles size={12} className="animate-pulse" />
              Secretaria do Castelo
            </h3>
            <p className="text-[10px] text-foreground/65 font-serif italic">Informações e registros oficiais</p>
          </div>
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[9px] sm:text-[10px] font-heading font-bold uppercase tracking-[0.04em] sm:tracking-widest text-primary/60 hover:text-primary transition-all flex items-center justify-center gap-1.5 bg-primary/5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full border border-primary/10 shadow-lg active:scale-95 w-full sm:w-auto"
          >
            {isExpanded ? (
              <>Recolher <ChevronUp size={12} /></>
            ) : (
              <>Explorar Atividades <ChevronDown size={12} /></>
            )}
          </button>
        </div>

        <AnimatePresence>
          <motion.div 
            initial={false}
            animate={{ 
              height: isExpanded ? "auto" : "0px", 
              opacity: isExpanded ? 1 : 0,
              marginBottom: isExpanded ? "24px" : "0px"
            }}
            className="overflow-hidden space-y-6"
          >
            <div className="grid grid-cols-1 gap-6 pt-2">
              <MagicalMemories />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <BirthdayBanner />
                <VipUpsellBanner
                  currentVip={(profile as any)?.vip_plan}
                  galeons={(profile as any)?.galeons ?? 0}
                  username={profile?.full_name}
                />
              </div>
              <DailyHighlight />
              <MoodSession />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/20 to-transparent my-10 opacity-50" />
    </div>
  );
}
