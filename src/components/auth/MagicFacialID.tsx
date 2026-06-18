import React, { useRef, useState, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import { Button } from "@/components/ui/button";
import { Camera, RefreshCw, ShieldCheck, ShieldAlert, Sparkles, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import MagicalIcon from "@/components/shared/MagicalIcon";

interface MagicFacialIDProps {
  onValidated: (imageData: string) => void;
  mode: "enroll" | "verify";
  referenceImage?: string;
  onCancel?: () => void;
}

export default function MagicFacialID({ onValidated, mode, referenceImage, onCancel }: MagicFacialIDProps) {
  const webcamRef = useRef<Webcam>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [status, setStatus] = useState<"idle" | "scanning" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [cameraReady, setCameraReady] = useState(false);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setImgSrc(imageSrc);
      validate(imageSrc);
    }
  }, [webcamRef]);

  const validate = async (capturedImg: string) => {
    setIsValidating(true);
    setStatus("scanning");
    
    // Simulação de processamento mágico de identidade
    // Em um cenário real, enviaríamos para um serviço de biometria
    // Aqui, garantimos o fluxo funcional e a experiência do usuário
    setTimeout(() => {
      try {
        // "Magia de Identidade" - Simulação de verificação
        // Se for enroll (cadastro), apenas confirmamos a captura nítida
        // Se for verify (login), simulamos a comparação com a referência
        
        // Simulação de "Entropia Mágica" para validação
        const faceMatch = Math.random() > 0.1; // 90% de chance de sucesso imediato
        
        if (!faceMatch && mode === "verify") {
          throw new Error("Essência desalinhada.");
        }

        setStatus("success");
        setIsValidating(false);
        toast.success(mode === "enroll" ? "Essência capturada com sucesso!" : "Identidade Mágica reconhecida!");
        
        setTimeout(() => {
          onValidated(capturedImg);
        }, 1200);
      } catch (err) {
        setStatus("error");
        setIsValidating(false);
        setErrorMessage("Não foi possível validar sua essência mágica. Tente novamente em um ambiente mais iluminado ou remova o capuz.");
      }
    }, 2500);
  };

  const retake = () => {
    setImgSrc(null);
    setStatus("idle");
    setErrorMessage("");
  };

  return (
    <div className="flex flex-col items-center gap-6 p-4">
      <div className="relative w-full aspect-square max-w-[320px] rounded-full overflow-hidden border-4 border-primary/30 shadow-[0_0_50px_rgba(var(--primary-rgb),0.2)] bg-black/40">
        {!imgSrc ? (
          <>
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode: "user" }}
              className="w-full h-full object-cover"
              onUserMedia={() => setCameraReady(true)}
              onUserMediaError={() => {
                setStatus("error");
                setErrorMessage("Permissão de câmera negada ou câmera não encontrada.");
              }}
            />
            {cameraReady && (
              <div className="absolute inset-0 pointer-events-none">
                {/* Overlay de Scan */}
                <motion.div 
                  initial={{ top: "0%" }}
                  animate={{ top: "100%" }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute left-0 right-0 h-0.5 bg-primary/50 shadow-[0_0_15px_hsl(var(--primary))] z-10"
                />
                <div className="absolute inset-0 border-[40px] border-black/20 rounded-full" />
                <div className="absolute inset-4 border border-primary/20 rounded-full border-dashed animate-spin-slow" />
              </div>
            )}
          </>
        ) : (
          <div className="relative w-full h-full">
            <img src={imgSrc} alt="Captured face" className="w-full h-full object-cover grayscale brightness-110" />
            <AnimatePresence>
              {isValidating && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-primary/20 backdrop-blur-sm flex flex-col items-center justify-center text-white"
                >
                  <div className="relative">
                    <Loader2 className="w-16 h-16 animate-spin text-primary/80" />
                    <Sparkles className="absolute inset-0 m-auto w-6 h-6 animate-pulse text-primary" />
                  </div>
                  <p className="font-heading text-lg mt-4 tracking-widest animate-pulse drop-shadow-[0_0_10px_rgba(212,175,55,0.5)]">Lendo Essência...</p>
                </motion.div>
              )}
              {status === "success" && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute inset-0 bg-green-500/30 flex items-center justify-center"
                >
                  <ShieldCheck className="w-20 h-20 text-green-400 drop-shadow-lg" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      <div className="w-full text-center space-y-4">
        <div className="min-h-[40px]">
          {status === "idle" && (
            <p className="text-sm text-muted-foreground italic">Posicione seu rosto no centro do círculo mágico.</p>
          )}
          {status === "error" && (
            <p className="text-sm text-destructive font-medium">{errorMessage}</p>
          )}
          {status === "success" && (
            <div className="flex items-center justify-center gap-2 text-green-400 font-heading">
              <Sparkles size={16} />
              <span>Identidade Reconhecida</span>
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-center">
          {!imgSrc ? (
            <>
              {onCancel && (
                <Button variant="ghost" onClick={onCancel} disabled={isValidating}>
                  Voltar
                </Button>
              )}
              <Button 
                variant="magical" 
                onClick={capture} 
                disabled={!cameraReady || isValidating}
                className="px-8 shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:shadow-[0_0_30px_rgba(212,175,55,0.5)] transition-all"
              >
                <ShieldCheck className="mr-2 w-4 h-4" /> Validar Identidade
              </Button>
            </>
          ) : (
            <>
              {status === "error" && (
                <Button variant="outline" onClick={retake} disabled={isValidating}>
                  <RefreshCw className="mr-2 w-4 h-4" /> Tentar Novamente
                </Button>
              )}
              {status === "success" && (
                <div className="text-xs text-muted-foreground animate-pulse">Aguarde a finalização...</div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
