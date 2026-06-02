import { lazy, Suspense } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import SafeImage from "@/components/SafeImage";
import MagicalGaleon from "@/components/shared/MagicalGaleon";
import Card3D from "@/components/Card3D";
import type { StoreItem } from "@/types";

const Wand3D = lazy(() => import("@/components/three/Wand3D"));

interface Props {
  item: StoreItem | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  owned: boolean;
  onBuy: (item: StoreItem) => void;
}

export default function ItemPreviewDialog({ item, open, onOpenChange, owned, onBuy }: Props) {
  if (!item) return null;
  const isWand = item.category === "wand";
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card/95 backdrop-blur-xl border border-primary/30">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl text-gold-gradient">{item.name}</DialogTitle>
        </DialogHeader>
        <div className="grid sm:grid-cols-2 gap-6">
          <Card3D intensity={14} glare lift className="relative aspect-square rounded-2xl overflow-hidden border border-primary/20 bg-black/40">
            <SafeImage src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
            {isWand && (
              <Suspense fallback={null}>
                <Wand3D className="absolute inset-0" />
              </Suspense>
            )}
          </Card3D>
          <div className="flex flex-col justify-between">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {item.description || "Um item mágico de Gringotts, forjado com encantamentos ancestrais."}
              </p>
              <div className="flex items-center gap-2 pt-2">
                <MagicalGaleon size="sm" />
                <span className="font-heading text-2xl text-yellow-400">{item.price_galeons}</span>
                <span className="text-xs text-muted-foreground">Galeões</span>
              </div>
            </div>
            <Button
              variant="magical"
              className="w-full h-12 mt-6"
              disabled={owned}
              onClick={() => { onBuy(item); onOpenChange(false); }}
            >
              {owned ? "Já é seu" : "Adquirir agora"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}