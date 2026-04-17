import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

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
      <DialogContent className="sm:max-w-md bg-secondary/95 border-primary/20 backdrop-blur-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl text-gold-gradient text-center">O Enigma da Esfinge</DialogTitle>
          <DialogDescription className="text-center text-foreground mt-4 text-lg font-serif">
            "{question}"
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <Input 
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Sua resposta..."
            className="bg-background/50 border-primary/30 text-center"
            autoFocus
          />
          <div className="flex gap-3 justify-center">
            <Button type="button" variant="ghost" onClick={onClose}>Fugir</Button>
            <Button type="submit" variant="magical">Responder ⚡</Button>
          </div>
          <p className="text-[10px] text-muted-foreground text-center">Cuidado! Respostas erradas te deixarão em cooldown.</p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
