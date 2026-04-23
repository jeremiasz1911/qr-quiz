"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogIn, Users } from "lucide-react";
import { FirebaseEnvGuard } from "@/components/layout/firebase-env-guard";
import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export default function AdminLoginPage() {
  const router = useRouter();
  const { user, loading, loginWithGoogle, loginAsKatolik } = useAuth();

  useEffect(() => {
    if (user) {
      router.replace("/admin/dashboard");
    }
  }, [router, user]);

  return (
    <FirebaseEnvGuard>
      <PageShell className="flex min-h-[70vh] items-center justify-center">
        <Card className="w-full max-w-md p-6">
          <h1 className="text-2xl font-bold text-white">Logowanie prowadzącego</h1>
          <p className="mt-2 text-sm text-slate-300">
            Zaloguj się przez Google albo wybierz publiczne konto &quot;Katolik&quot; (bez hasła).
          </p>
          <Button
            size="lg"
            className="mt-5 w-full"
            onClick={() => void loginWithGoogle()}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
            Zaloguj przez Google
          </Button>
          <Button
            size="lg"
            variant="secondary"
            className="mt-3 w-full"
            onClick={() => void loginAsKatolik()}
            disabled={loading}
          >
            <Users className="mr-2 h-4 w-4" />
            Logowanie przez Katolik
          </Button>
        </Card>
      </PageShell>
    </FirebaseEnvGuard>
  );
}
