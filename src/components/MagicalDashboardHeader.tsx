import { useAuth } from "@/lib/auth";
import DynamicGreeting from "./DynamicGreeting";
import StoriesBar from "./StoriesBar";
import MagicalMemories from "./MagicalMemories";
import BirthdayBanner from "./BirthdayBanner";
import VipUpsellBanner from "./VipUpsellBanner";
import DailyHighlight from "./DailyHighlight";
import MoodSession from "./MoodSession";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { ChevronDown, ChevronUp, Sparkles, Trophy } from "lucide-react";
import DailyProphetTicker from "./DailyProphetTicker";
import HouseCupWidget from "./HouseCupWidget";

export default function MagicalDashboardHeader() {
  const { profile } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="space-y-6 w-full max-w-4xl mx-auto">
      <div className="space-y-4">
        <DailyProphetTicker />
        <DynamicGreeting />
        <HouseCupWidget />
      </div>

      <StoriesBar />
      
      <div className="relative">
        <div className="flex items-center justify-between px-4 mb-4">
          <h3 className="text-[10px] font-heading font-black uppercase tracking-[0.4em] text-primary/40 flex items-center gap-2">
            <Sparkles size={12} />
            Secretaria do Castelo
          </h3>
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[10px] font-heading font-bold uppercase tracking-widest text-primary/60 hover:text-primary transition-colors flex items-center gap-1 bg-primary/5 px-3 py-1 rounded-full border border-primary/10 shadow-inner"
          >
            {isExpanded ? (
              <>Recolher <ChevronUp size={12} /></>
            ) : (
              <>Ver Atividades <ChevronDown size={12} /></>
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
            className="overflow-hidden space-y-4"
          >
            <div className="grid grid-cols-1 gap-4">
              <MagicalMemories />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
    </div>
  );
}
