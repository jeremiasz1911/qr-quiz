import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-10 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 text-slate-50 outline-none ring-blue-500/40 transition focus:ring-2",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

