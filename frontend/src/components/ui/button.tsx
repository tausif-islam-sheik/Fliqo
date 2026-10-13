import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 overflow-hidden font-semibold whitespace-nowrap transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 disabled:pointer-events-none disabled:opacity-60 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "gloss rounded-full bg-gradient-to-b from-brand-500 via-brand-600 to-brand-800 text-white shadow-[0_6px_16px_-6px_rgb(13_26_51/0.6),inset_0_1px_0_rgb(255_255_255/0.25)] hover:from-brand-400 hover:via-brand-600 hover:to-brand-800",
        accent:
          "gloss rounded-full bg-gradient-to-b from-gold-300 via-gold-400 to-gold-600 text-brand-950 shadow-[0_6px_16px_-6px_rgb(245_163_1/0.7),inset_0_1px_0_rgb(255_255_255/0.5)] hover:from-gold-200 hover:via-gold-400 hover:to-gold-600",
        destructive:
          "rounded-full bg-gradient-to-b from-red-500 to-red-700 text-white shadow-sm hover:from-red-400 hover:to-red-700",
        outline:
          "rounded-full border border-slate-300 bg-white text-slate-700 shadow-sm hover:border-brand-400 hover:text-brand-700",
        secondary: "rounded-full bg-slate-100 text-slate-800 hover:bg-slate-200",
        ghost: "rounded-full text-brand-700 hover:bg-brand-50",
        link: "rounded-full text-brand-700 underline-offset-4 hover:underline"
      },
      size: {
        sm: "h-8 px-3 text-xs",
        default: "h-10 px-4 py-2 text-sm",
        md: "h-11 px-5 py-2.5 text-sm",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
