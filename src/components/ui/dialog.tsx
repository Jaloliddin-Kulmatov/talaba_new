"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogClose = DialogPrimitive.Close;

interface DialogContentProps
  extends Omit<React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>, "title"> {
  title: string;
  description?: string;
}

/**
 * Bottom sheet on phones, centred modal from `sm` up. Radix handles focus
 * trapping, Escape, scroll lock and aria wiring.
 */
const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ className, children, title, description, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="dialog-overlay fixed inset-0 z-[100] bg-slate-950/50 backdrop-blur-sm" />
    <DialogPrimitive.Content
      ref={ref}
      {...(description ? {} : { "aria-describedby": undefined })}
      className={cn(
        "dialog-content fixed z-[101] flex flex-col bg-card text-card-foreground border border-border shadow-2xl focus:outline-none",
        "inset-x-0 bottom-0 max-h-[92dvh] rounded-t-3xl",
        "sm:inset-auto sm:left-1/2 sm:top-1/2 sm:w-[calc(100%-2rem)] sm:max-w-lg sm:max-h-[88dvh] sm:rounded-2xl",
        className,
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-3">
        <div className="min-w-0">
          <DialogPrimitive.Title className="text-base font-semibold text-foreground">{title}</DialogPrimitive.Title>
          {description ? (
            <DialogPrimitive.Description className="mt-0.5 text-xs text-muted-foreground">
              {description}
            </DialogPrimitive.Description>
          ) : null}
        </div>
        <DialogPrimitive.Close
          aria-label="Yopish"
          className="-mr-1.5 -mt-1 rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <X size={18} />
        </DialogPrimitive.Close>
      </div>
      <div className="overflow-y-auto px-5 pb-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">{children}</div>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
DialogContent.displayName = "DialogContent";

export { Dialog, DialogTrigger, DialogClose, DialogContent };
