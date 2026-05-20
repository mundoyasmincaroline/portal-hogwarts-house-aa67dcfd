import React, { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Sparkles, Scroll } from "lucide-react";

interface AcceptanceLetterProps {
  fullName: string;
  house?: string;
  blood?: string;
  wandWood?: string;
  wandCore?: string;
  onContinue: () => void;
  isPreview?: boolean;
}

export default function AcceptanceLetter({ 
  fullName, 
  house, 
  blood, 
  wandWood, 
  wandCore, 
  onContinue,
  isPreview = false 
}: AcceptanceLetterProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setTimeout(() => setShow(true), 500);
  }, []);

  return (
    <div className={`${isPreview ? '' : 'fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md'} transition-all duration-1000 ${show ? 'opacity-100' : 'opacity-0'}`}>
      <div className={`relative max-w-lg w-full transform transition-all duration-1000 ${show ? 'scale-100 translate-y-0' : 'scale-90 translate-y-10'} mx-auto`}>
        {/* The Letter Parchment */}
        <div className="relative bg-[#f4e4bc] p-10 md:p-16 rounded-sm shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7)] border-double border-8 border-[#8d775f] overflow-hidden">
          {/* Wax Seal */}
          <div className="absolute top-8 right-8 w-16 h-16 bg-[#a12d2d] rounded-full flex items-center justify-center shadow-lg border-2 border-[#7d2222] animate-pulse">
            <span className="text-white font-heading text-2xl">H</span>
          </div>

          <div className="space-y-6 font-serif text-[#3e2c1c]">
            <div className="space-y-1">
              <p className="font-bold text-lg">ESCOLA DE MAGIA E BRUXARIA DE HOGWARTS</p>
              <p className="text-[10px] uppercase tracking-widest opacity-70">Diretor: Alvo Dumbledore</p>
              <p className="text-[10px] opacity-60 italic">(Ordem de Merlim, Primeira Classe, Grande Feiticeiro, Bruxo Chefe, Cacique Supremo, Confederação Internacional de Bruxos)</p>
            </div>

            <div className="pt-8">
              <p className="mb-4">Prezado(a) Sr(a). <span className="font-bold border-b border-[#3e2c1c]/30">{fullName.split(' ')[0]}</span>,</p>
              <p className="leading-relaxed">
                Temos o prazer de informar que V. Sa. tem uma vaga na Escola de Magia e Bruxa de Hogwarts. 
                Estamos enviando a lista de todos os livros e equipamentos necessários.
              </p>
              <p className="mt-4 leading-relaxed">
                O ano letivo começa em 1º de setembro. Aguardamos sua coruja até 31 de julho, no mais tardar.
              </p>
            </div>

            {(house || blood || wandWood) && (
              <div className="pt-4 border-t border-[#3e2c1c]/10 space-y-1">
                <p className="text-[10px] uppercase tracking-widest font-bold opacity-80">Registros do Ministério:</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                  {house && <p><strong>Casa:</strong> {house}</p>}
                  {blood && <p><strong>Sangue:</strong> {blood}</p>}
                  {wandWood && wandCore && (
                    <p className="col-span-2"><strong>Varinha:</strong> {wandWood} e {wandCore}</p>
                  )}
                </div>
              </div>
            )}

            <div className="pt-4">
              <p>Atenciosamente,</p>
              <p className="font-bold text-lg mt-1 italic">Minevra McGonagall</p>
              <p className="text-[10px] opacity-70">Diretora Substituta</p>
            </div>
          </div>
          
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-[#3e2c1c]/5 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Action Button */}
        <div className="mt-8 flex justify-center">
          <Button 
            variant="magical" 
            size="lg" 
            onClick={onContinue}
            className="h-16 px-12 rounded-2xl bg-gradient-to-r from-yellow-600 via-amber-400 to-yellow-600 text-black border-none font-bold text-xl shadow-[0_20px_50px_rgba(234,179,8,0.4)] animate-bounce"
          >
            {isPreview ? "CONFIRMAR E SELAR" : "ATRAVESSAR O PORTAL"} <Sparkles className="ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
