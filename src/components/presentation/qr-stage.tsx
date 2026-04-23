"use client";

import { QRCodeSVG } from "qrcode.react";
import { Card } from "@/components/ui/card";

export function QrStage({ title, link }: { title: string; link: string }) {
  return (
    <Card className="flex h-full min-h-0 flex-col items-center justify-center gap-4 p-5 text-center md:gap-6 md:p-7">
      <h1 className="max-w-5xl text-3xl font-bold leading-tight text-white md:text-5xl">{title}</h1>
      <div className="rounded-3xl bg-white p-5">
        <QRCodeSVG value={link} size={260} includeMargin />
      </div>
      <p className="max-w-full truncate text-xl text-blue-200 md:text-2xl">{link}</p>
    </Card>
  );
}
