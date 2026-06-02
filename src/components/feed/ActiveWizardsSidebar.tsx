import { isUserOnline } from "@/lib/auth";
import SafeImage from "@/components/SafeImage";

interface ActiveWizardsSidebarProps {
  onlineUsers: any[];
}

export function ActiveWizardsSidebar({ onlineUsers }: ActiveWizardsSidebarProps) {
  return (
    <div className="glass rounded-[2rem] p-6 shadow-2xl">
      <h3 className="font-heading text-xs uppercase tracking-[0.3em] text-primary/90 mb-6 flex items-center gap-3">
        <span className="w-8 h-[1px] bg-primary/40" />
        Bruxos Ativos
      </h3>
      
      <div className="space-y-4 mb-8">
        {/* Morpheus - Arquiteto */}
        <div className="flex items-center gap-3 p-3 bg-black/40 border border-green-500/20 rounded-2xl group transition-all hover:border-green-500/40">
          <div className="w-10 h-10 rounded-xl shrink-0 border border-green-500/30 relative bg-black flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-green-500/5 animate-pulse" />
            <span className="text-green-500 font-mono text-sm font-bold">M</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-green-500 font-bold font-mono tracking-widest uppercase">Morpheus</p>
            <p className="text-[8px] font-mono text-green-500/40 uppercase">System Architect</p>
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-pulse" />
        </div>

        {/* Yasmin Caroline - A Fundadora */}
        <div className="flex items-center gap-3 p-3 bg-white/5 border border-yellow-500/20 rounded-2xl group transition-all hover:border-yellow-500/40 hover:scale-[1.02]">
          <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-yellow-500/30 relative">
            <SafeImage src="https://i.pinimg.com/736x/8e/31/b0/8e31b0a8801d4a04d55cc3b89b88cfbb.jpg" alt="Yasmin" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-yellow-500 font-bold font-heading uppercase tracking-wider">Yasmin Caroline</p>
            <p className="text-[8px] text-yellow-500/40 font-black uppercase tracking-[0.2em]">A Fundadora</p>
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.8)] animate-bounce" />
        </div>

        {/* Filch - O Vigilante */}
        <div className="flex items-center gap-3 p-3 bg-white/5 border border-red-500/10 rounded-2xl group opacity-60 hover:opacity-100 transition-all">
          <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-red-500/20 grayscale group-hover:grayscale-0 transition-all">
            <SafeImage src="https://i.pinimg.com/736x/8e/31/b0/8e31b0a8801d4a04d55cc3b89b88cfbb.jpg" alt="Filch" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-red-500 font-bold font-heading uppercase tracking-wider">Argus Filch</p>
            <p className="text-[8px] text-red-500/30 font-black uppercase tracking-[0.2em]">O Vigilante</p>
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-red-900 shadow-[0_0_8px_rgba(153,27,27,0.8)]" />
        </div>
      </div>

      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar border-t border-white/5 pt-6">
        {onlineUsers.length === 0 && (
          <p className="text-xs text-muted-foreground">Ninguém à vista.</p>
        )}
        {onlineUsers.map((u) => (
          <div key={u.id} className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full overflow-hidden border-2 shrink-0 ${u.house === 'gryffindor' ? 'border-red-500' : u.house === 'slytherin' ? 'border-green-500' : u.house === 'ravenclaw' ? 'border-blue-500' : 'border-yellow-500'}`}>
              <SafeImage 
                src={u.avatar_url} 
                alt={u.username} 
                className="w-full h-full object-cover" 
                fallbackText={u.full_name}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-foreground truncate">{u.full_name.split(' ')[0]}</p>
            </div>
            <span className={`w-2 h-2 rounded-full ${isUserOnline(u) ? 'bg-green-500' : 'bg-muted'}`} title={isUserOnline(u) ? 'Online' : 'Offline'} />
          </div>
        ))}
      </div>
    </div>
  );
}
