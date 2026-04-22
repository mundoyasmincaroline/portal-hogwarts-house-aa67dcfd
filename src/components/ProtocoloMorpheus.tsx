import { useState, useEffect } from "react";
import { CheckCircle2, Circle, AlertTriangle, Zap, TrendingUp, ShieldCheck, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Protocol {
  id: string;
  name: string;
  status: 'active' | 'pending' | 'warning';
  description: string;
  action?: string;
  percentage: number;
}

/**
 * ProtocoloMorpheus - Sistema de Checks Jarvis "10 Passos à Frente".
 * Central de produtividade para garantir a estabilidade e lucratividade do portal.
 */
export default function ProtocoloMorpheus() {
  const [protocols, setProtocols] = useState<Protocol[]>([
    { id: 'pwa', name: 'Protocolo PWA (Instalação)', status: 'active', percentage: 100, description: 'Motor de instalação mobile e ícones Monster Quality configurados.' },
    { id: 'notify', name: 'Protocolo Corujas (Notificações)', status: 'active', percentage: 100, description: 'Prompt de notificação cinemático ativo no Dashboard.' },
    { id: 'ads', name: 'Protocolo Morpheus (Publicidade)', status: 'active', percentage: 100, description: 'Sistema de anúncios nativos e Profeta Diário operacionais.' },
    { id: 'finance', name: 'Protocolo Gringotts (Financeiro)', status: 'warning', percentage: 40, description: 'Aguardando configuração de chaves InfinitePay reais.' },
    { id: 'safety', name: 'Protocolo Filch (Segurança)', status: 'active', percentage: 100, description: 'Filtro de chat e moderação automática de termos proibidos.' },
    { id: 'viral', name: 'Protocolo Fênix (Crescimento)', status: 'pending', percentage: 15, description: 'Ganchos virais e links de convite em fase de implementação.' },
  ]);

  const totalProgress = Math.round(protocols.reduce((acc, p) => acc + p.percentage, 0) / protocols.length);

  return (
    <div className="glass rounded-[2rem] p-8 border-2 border-primary/30 bg-gradient-to-br from-black via-primary/5 to-black relative overflow-hidden group">
      {/* Background Effect */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
      
      <div className="relative z-10 space-y-6">
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <h2 className="font-heading text-3xl text-gold-gradient tracking-tighter">CENTRAL DE PROTOCOLOS</h2>
            <p className="text-xs text-muted-foreground uppercase tracking-[0.3em] font-bold">Iniciativa Morpheus & Jarvis</p>
          </div>
          <div className="text-right">
             <span className="text-4xl font-heading text-primary">{totalProgress}%</span>
             <p className="text-[10px] text-muted-foreground uppercase font-bold">Estabilidade Global</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/10">
           <div 
             className="h-full bg-gradient-to-r from-primary via-yellow-400 to-primary transition-all duration-1000 shadow-[0_0_15px_rgba(234,179,8,0.5)]" 
             style={{ width: `${totalProgress}%` }}
           />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
          {protocols.map((p) => (
            <div key={p.id} className="glass bg-white/5 p-4 rounded-2xl border border-white/10 flex gap-4 hover:border-primary/40 transition-all group">
              <div className="shrink-0 pt-1">
                {p.status === 'active' && <CheckCircle2 className="text-green-500" size={20} />}
                {p.status === 'pending' && <Circle className="text-muted-foreground" size={20} />}
                {p.status === 'warning' && <AlertTriangle className="text-yellow-500 animate-pulse" size={20} />}
              </div>
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex justify-between items-center">
                   <h4 className="font-heading text-sm text-foreground">{p.name}</h4>
                   <span className="text-[10px] text-primary font-bold">{p.percentage}%</span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2 italic">"{p.description}"</p>
                {p.status !== 'active' && (
                  <Button variant="link" className="p-0 h-auto text-[10px] text-primary uppercase font-bold tracking-widest hover:no-underline">
                     Executar Protocolo 🪄
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Jarvis Productivity Tip */}
        <div className="mt-8 p-6 rounded-3xl bg-primary/10 border border-primary/20 flex items-center gap-6 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10">
              <Zap size={60} className="text-primary" />
           </div>
           <div className="p-4 bg-primary/20 rounded-2xl text-primary shrink-0 animate-pulse">
              <TrendingUp size={24} />
           </div>
           <div className="space-y-1 relative z-10">
              <h4 className="font-heading text-sm text-primary uppercase tracking-widest">Recomendação do Jarvis: Foco em Monetização</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                "Detectei 48 horas de inatividade financeira. Sugiro cadastrar os **2 links da Shopee/TikTok** imediatamente usando o Sistema Morpheus para converter o tráfego viral em Galeões Reais."
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}
