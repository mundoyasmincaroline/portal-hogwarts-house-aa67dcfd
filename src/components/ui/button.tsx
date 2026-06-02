import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/core-utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-heading tracking-wide transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:scale-95 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_4px_12px_rgba(212,175,55,0.25)] hover:bg-primary/90 hover:shadow-[0_8px_24px_rgba(212,175,55,0.4)] hover:-translate-y-1 active:scale-95 transition-all duration-300",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 hover:-translate-y-0.5 transition-all",
        outline:
          "border border-primary/20 bg-white/5 backdrop-blur-md hover:bg-primary/10 hover:border-primary/40 hover:text-primary hover:-translate-y-1 active:scale-95 transition-all duration-300",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 hover:-translate-y-0.5 transition-all",
        ghost: "hover:bg-primary/10 hover:text-primary transition-all rounded-xl",
        link: "text-primary underline-offset-4 hover:underline",
        magical: 
          "relative overflow-hidden bg-gradient-to-br from-[#d4af37] via-[#fcf6ba] to-[#b8860b] text-black font-black uppercase tracking-widest shadow-[0_10px_25px_-10px_rgba(212,175,55,0.6)] hover:shadow-[0_20px_40px_-5px_rgba(212,175,55,0.7)] hover:-translate-y-1.5 active:scale-90 transition-all duration-500 border border-white/30 after:content-[''] after:absolute after:inset-0 after:bg-white/20 after:opacity-0 hover:after:opacity-100 after:transition-opacity",
        glass:
          "bg-white/10 backdrop-blur-xl border border-white/10 hover:border-primary/40 hover:bg-primary/5 hover:text-primary hover:-translate-y-1 transition-all duration-300 shadow-xl",
        plaque: 
          "relative overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-800 to-black border border-white/10 text-white font-heading uppercase tracking-widest shadow-[0_20px_40px_rgba(0,0,0,0.8)] backdrop-blur-xl transition-all duration-500 hover:scale-[1.05] hover:border-primary/50 hover:text-primary active:scale-95 disabled:opacity-50",
        gryffindor: "bg-gryffindor text-foreground hover:bg-gryffindor/90 hover:-translate-y-1 transition-all shadow-[0_6px_20px_rgba(239,68,68,0.3)]",
        slytherin: "bg-slytherin text-foreground hover:bg-slytherin/90 hover:-translate-y-1 transition-all shadow-[0_6px_20px_rgba(34,197,94,0.3)]",
        ravenclaw: "bg-ravenclaw text-foreground hover:bg-ravenclaw/90 hover:-translate-y-1 transition-all shadow-[0_6px_20px_rgba(59,130,246,0.3)]",
        hufflepuff: "bg-hufflepuff text-primary-foreground hover:bg-hufflepuff/90 hover:-translate-y-1 transition-all shadow-[0_6px_20px_rgba(234,179,8,0.3)]",
      },
      size: {
        // Tokens de tamanho — sempre ≥44px no mobile (touch-min)
        default: "h-btn-md min-h-touch px-space-lg py-space-xs",
        sm:      "h-btn-sm min-h-touch md:min-h-btn-sm rounded-lg px-space-md text-xs",
        lg:      "h-btn-lg min-h-touch-lg rounded-2xl px-space-2xl text-base",
        icon:    "h-touch w-touch md:h-10 md:w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
