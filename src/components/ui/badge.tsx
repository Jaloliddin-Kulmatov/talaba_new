import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-blue-500/10 text-blue-700 dark:text-blue-300 hover:bg-blue-500/15",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/15",
        outline: "text-foreground border-border",
        success:
          "border-transparent bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
        warning:
          "border-transparent bg-amber-500/10 text-amber-700 dark:text-amber-400",
        cyan:
          "border-transparent bg-cyan-500/10 text-cyan-700 dark:text-cyan-400",
        violet:
          "border-transparent bg-violet-500/10 text-violet-700 dark:text-violet-400",
        new: "border-blue-500/25 bg-gradient-to-r from-blue-500/15 to-emerald-500/15 text-blue-700 dark:text-blue-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
