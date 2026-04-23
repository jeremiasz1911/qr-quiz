import Link from "next/link";
import { ArrowRight, Presentation, QrCode, Vote } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";

export default function HomePage() {
  return (
    <PageShell className="space-y-8">
      <header className="space-y-4">
        <p className="inline-flex rounded-full border border-blue-300/30 bg-blue-500/15 px-3 py-1 text-sm text-blue-100">
          Live Polling Platform
        </p>
        <h1 className="max-w-3xl text-4xl font-bold leading-tight text-white md:text-5xl">
          Nowoczesne głosowania na żywo podczas prezentacji i wykładów
        </h1>
        <p className="max-w-2xl text-slate-300">
          Prowadzący tworzy pytania, uczestnicy głosują przez QR, a wyniki aktualizują się w czasie rzeczywistym.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <QrCode className="mb-3 h-6 w-6 text-blue-200" />
          <p className="font-semibold text-white">Skan QR</p>
          <p className="text-sm text-slate-300">Publiczny, mobilny widok bez logowania</p>
        </Card>
        <Card className="p-5">
          <Vote className="mb-3 h-6 w-6 text-emerald-200" />
          <p className="font-semibold text-white">Głosowanie live</p>
          <p className="text-sm text-slate-300">onSnapshot + natychmiastowe odświeżanie wyników</p>
        </Card>
        <Card className="p-5">
          <Presentation className="mb-3 h-6 w-6 text-violet-200" />
          <p className="font-semibold text-white">Widok projektora</p>
          <p className="text-sm text-slate-300">Tryb QR i tryb wyników z wykresami</p>
        </Card>
      </div>

      <Link
        href="/admin/login"
        className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-5 py-3 font-semibold text-white hover:bg-blue-400"
      >
        Przejdź do panelu prowadzącego
        <ArrowRight className="h-4 w-4" />
      </Link>
    </PageShell>
  );
}

