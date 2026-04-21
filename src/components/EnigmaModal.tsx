import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Sparkles, HelpCircle, Lock, Wand2 } from "lucide-react";

interface EnigmaModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: string;
  onAnswer: (answer: string) => void;
}

export default function EnigmaModal({ isOpen, onClose, question, onAnswer }: EnigmaModalProps) {
  const [answer, setAnswer] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim()) return;
    onAnswer(answer);
    setAnswer("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-[#0a0a0c]/95 border-primary/30 backdrop-blur-2xl rounded-[3rem] overflow-hidden shadow-[0_0_50px_rgba(var(--primary),0.2)]">
        {/* Background Glows */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-shimmer" />
        <div className="absolute -top-20 -left-20 w-48 h-48 bg-primary/10 rounded-full blur-[80px]" />
        
        <DialogHeader className="relative z-10 pt-8">
          <div className="flex justify-center mb-6">
            <div className="relative group">
                <div className="absolute inset-0 bg-primary/30 rounded-full blur-2xl group-hover:bg-primary/50 transition-all duration-500 animate-pulse" />
                <div className="relative w-24 h-24 rounded-full bg-black/60 border-2 border-primary/40 flex items-center justify-center shadow-2xl transition-transform group-hover:scale-110">
                   <span className="text-5xl animate-float">🔮</span>
                </div>
            </div>
          </div>
          <DialogTitle className="font-heading text-3xl text-gold-gradient text-center tracking-tighter">O Enigma da Esfinge</DialogTitle>
          <DialogDescription asChild>
            <div className="relative mt-6 p-6 rounded-2xl bg-white/[0.03] border border-white/5">
                <Sparkles className="absolute -top-2 -right-2 text-primary/40" size={20} />
                <p className="text-center text-white/80 text-lg font-serif italic leading-relaxed">
                  "{question}"
                </p>
                <Sparkles className="absolute -bottom-2 -left-2 text-primary/40" size={20} />
            </div>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="relative z-10 space-y-6 mt-4 pb-4">
          <div className="relative">
            <Input 
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Sussurre sua resposta..."
                className="h-16 bg-black/40 border-primary/20 text-center text-lg font-heading tracking-widest focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all rounded-2xl"
                autoFocus
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button type="button" variant="ghost" onClick={onClose} className="flex-1 h-14 rounded-xl text-white/40 hover:text-white hover:bg-white/5 font-heading text-xs tracking-widest uppercase">
              Fugir do Desafio
            </Button>
            <Button type="submit" variant="magical" className="flex-[2] h-14 rounded-xl shadow-[0_10px_20px_rgba(var(--primary),0.2)]">
              <Wand2 className="mr-2" size={18} />
              LANÇAR RESPOSTA ⚡
            </Button>
          </div>
          
          <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground uppercase tracking-tighter">
            <Lock size={12} className="text-primary/60" />
            <span>Cuidado! Erros despertam a fúria da Esfinge (Cooldown).</span>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
