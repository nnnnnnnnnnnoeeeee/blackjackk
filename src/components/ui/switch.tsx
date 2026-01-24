import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";

import { cn } from "@/lib/utils";

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full",
      "border-2 transition-all duration-200",
      "data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-primary data-[state=checked]:to-[hsl(43_74%_40%)]",
      "data-[state=checked]:border-primary/60 data-[state=checked]:shadow-[0_0_15px_hsl(43_74%_49%_/_0.4)]",
      "data-[state=unchecked]:bg-input data-[state=unchecked]:border-border/50",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "hover:scale-105 active:scale-95",
      className,
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-full",
        "bg-gradient-to-br from-background to-muted",
        "border-2 border-border/50",
        "shadow-[0_2px_4px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]",
        "ring-0 transition-all duration-200",
        "data-[state=checked]:translate-x-5 data-[state=checked]:border-primary/40",
        "data-[state=checked]:shadow-[0_0_10px_hsl(43_74%_49%_/_0.5)]",
        "data-[state=unchecked]:translate-x-0",
      )}
    />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
