import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        magical: "bg-gradient-to-br from-primary via-primary/80 to-primary/90 text-primary-foreground hover:shadow-[0_0_25px_hsl(43_65%_54%/0.4)] transition-all duration-300 active:scale-95 disabled:opacity-50 border border-primary/20",
        plaque: "relative overflow-hidden bg-gradient-to-br from-zinc-900/80 via-zinc-800/50 to-black/90 border border-white/10 text-white font-heading uppercase tracking-widest shadow-[0_15px_35px_rgba(0,0,0,0.6)] backdrop-blur-xl transition-all duration-500 hover:scale-[1.03] hover:border-white/25 active:scale-95 disabled:opacity-50 after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/10 after:to-transparent after:-translate-x-[200%] hover:after:translate-x-[200%] after:transition-transform after:duration-1000",

        gryffindor: "bg-gryffindor text-foreground hover:bg-gryffindor/80",
        slytherin: "bg-slytherin text-foreground hover:bg-slytherin/80",
        ravenclaw: "bg-ravenclaw text-foreground hover:bg-ravenclaw/80",
        hufflepuff: "bg-hufflepuff text-primary-foreground hover:bg-hufflepuff/80",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
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
