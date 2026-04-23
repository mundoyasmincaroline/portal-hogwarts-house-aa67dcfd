import React, { useState, useEffect } from "react";

export default function FilchShadow() {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: "10%", left: "-100px" });

  useEffect(() => {
    const triggerShadow = () => {
      if (Math.random() < 0.3) { // 30% chance every check
        const side = Math.random() > 0.5 ? "left" : "right";
        const top = Math.floor(Math.random() * 80) + 10;
        
        setPosition({
          top: `${top}%`,
          [side]: "-20px"
        } as any);
        
        setVisible(true);
        setTimeout(() => setVisible(false), 4000);
      }
    };

    const interval = setInterval(triggerShadow, 15000);
    return () => clearInterval(interval);
  }, []);

  if (!visible) return null;

  return (
    <div 
      className="fixed z-[300] pointer-events-none transition-all duration-[2000ms] ease-in-out opacity-40 grayscale contrast-150"
      style={{
        ...position,
        filter: "blur(4px)"
      }}
    >
      <div className="relative group">
         {/* Shadow of a man with a lantern */}
         <div className="text-8xl animate-pulse">👣</div>
         <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 opacity-0 animate-fade-in-out">
            <p className="text-[8px] text-white uppercase tracking-tighter whitespace-nowrap">"Estou de olho..."</p>
         </div>
      </div>
    </div>
  );
}
