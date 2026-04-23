import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-2xl border border-slate-700/60 bg-slate-900/70 backdrop-blur-sm", className)}
      {...props}
    />
  );
}

