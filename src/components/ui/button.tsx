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
          "bg-primary text-primary-foreground shadow-[0_4px_12px_rgba(212,175,55,0.25)] hover:bg-primary/90 hover:shadow-[0_6px_20px_rgba(212,175,55,0.4)] hover:-translate-y-0.5",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-border/40 bg-white/5 backdrop-blur-sm hover:bg-white/10 hover:border-primary/30 hover:text-primary hover:-translate-y-0.5",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-primary/10 hover:text-primary",
        link: "text-primary underline-offset-4 hover:underline",
        magical: 
          "relative overflow-hidden bg-gradient-to-br from-[#d4af37] via-[#fcf6ba] to-[#b8860b] text-black font-black uppercase tracking-widest shadow-[0_10px_20px_-10px_rgba(212,175,55,0.5)] hover:shadow-[0_15px_30px_-5px_rgba(212,175,55,0.6)] hover:-translate-y-1 active:scale-95 transition-all duration-500 border border-white/20",
        plaque: 
          "relative overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-800 to-black border border-white/10 text-white font-heading uppercase tracking-widest shadow-[0_20px_40px_rgba(0,0,0,0.8)] backdrop-blur-xl transition-all duration-500 hover:scale-[1.05] hover:border-primary/50 hover:text-primary active:scale-95 disabled:opacity-50",
        gryffindor: "bg-gryffindor text-foreground hover:bg-gryffindor/80 shadow-[0_4px_12px_rgba(239,68,68,0.2)]",
        slytherin: "bg-slytherin text-foreground hover:bg-slytherin/80 shadow-[0_4px_12px_rgba(34,197,94,0.2)]",
        ravenclaw: "bg-ravenclaw text-foreground hover:bg-ravenclaw/80 shadow-[0_4px_12px_rgba(59,130,246,0.2)]",
        hufflepuff: "bg-hufflepuff text-primary-foreground hover:bg-hufflepuff/80 shadow-[0_4px_12px_rgba(234,179,8,0.2)]",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 rounded-lg px-4 text-xs",
        lg: "h-14 rounded-2xl px-10 text-base",
        icon: "h-10 w-10",
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
