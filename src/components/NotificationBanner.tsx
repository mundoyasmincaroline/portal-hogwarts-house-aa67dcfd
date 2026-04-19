import { getSeasonalEvent } from "@/lib/seasonal";

export default function NotificationBanner() {
  const season = getSeasonalEvent();
  
  if (!season) return null;

  return (
    <div className={`w-full bg-gradient-to-r ${season.bannerColor} p-3 text-center border-b border-white/20 shadow-md relative overflow-hidden animate-fade-in-up z-40`}>
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay"></div>
      <div className="relative z-10 flex items-center justify-center gap-4 max-w-4xl mx-auto">
        <span className="text-3xl animate-pulse">{season.icon}</span>
        <div className="text-left flex-1 md:flex-none">
          <h3 className="font-heading text-sm md:text-base text-white drop-shadow-md leading-tight">{season.name}</h3>
          <p className="text-[10px] md:text-xs text-white/90 drop-shadow-sm mt-0.5">{season.description}</p>
        </div>
        <span className="text-3xl animate-pulse hidden sm:block" style={{ animationDelay: '0.5s' }}>{season.icon}</span>
      </div>
    </div>
  );
}
