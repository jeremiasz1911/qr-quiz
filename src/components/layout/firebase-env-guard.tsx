"use client";

import { AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { hasFirebaseEnv } from "@/lib/firebase";

export function FirebaseEnvGuard({ children }: { children: React.ReactNode }) {
  if (hasFirebaseEnv()) {
    return <>{children}</>;
  }

  return (
    <Card className="mx-auto mt-10 max-w-2xl p-6">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-1 h-5 w-5 text-amber-300" />
        <div>
          <h2 className="text-lg font-semibold text-white">Brak konfiguracji Firebase</h2>
          <p className="mt-2 text-sm text-slate-300">
            Uzupełnij `.env.local` zgodnie z `.env.example` i zrestartuj aplikację.
          </p>
        </div>
      </div>
    </Card>
  );
}
