import Image from "next/image";
import Link from "next/link";
import { CalendarCheck, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function KioskStartScreen() {
  return (
    <main className="grid min-h-dvh grid-rows-[auto_1fr_auto] bg-stone-50 text-neutral-950">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 sm:px-10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[8px] border border-neutral-200 bg-white p-1.5 shadow-sm">
            <Image
              src="/images/verhofste-logo.jpg"
              alt="Verhofsté logo"
              width={50}
              height={50}
              priority
              className="h-12 w-auto object-contain"
            />
          </div>
          <div>
            <p className="text-lg font-semibold text-neutral-950">Verhofsté NV</p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="h-8 rounded-[8px] border-emerald-200 bg-emerald-50 px-3 text-sm text-emerald-800"
        >
          Kiosk ready
        </Badge>
      </header>

      <section className="mx-auto flex w-full max-w-5xl flex-col items-center justify-center px-6 py-10 text-center sm:px-10">
        <div className="mb-8 flex size-20 items-center justify-center rounded-[8px] border border-neutral-200 bg-white shadow-sm">
          <CalendarCheck
            className="size-10 text-emerald-700"
            aria-hidden="true"
          />
        </div>
        <h1 className="max-w-3xl text-5xl font-semibold leading-tight text-neutral-950 md:text-7xl">
          Verhofsté Reception
        </h1>
        <p className="mt-6 max-w-2xl text-xl leading-8 text-neutral-600 md:text-2xl md:leading-10">
          Welcome. Select your host and we will notify them that you have
          arrived.
        </p>
        <Button
          asChild
          className="mt-12 h-20 rounded-[8px] bg-neutral-950 px-12 text-2xl font-semibold text-white hover:bg-neutral-800"
        >
          <Link href="/visitor">
            <CalendarCheck className="size-8" aria-hidden="true" />
            I have an appointment
          </Link>
        </Button>
      </section>

      <footer className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 text-sm text-neutral-500 sm:px-10">
        <span>Touch the main button to begin.</span>
        <Button
          asChild
          variant="ghost"
          className="h-12 rounded-[8px] px-4 text-neutral-500 hover:text-neutral-950"
        >
          <Link href="/pin" aria-label="Employee access">
            <ShieldCheck className="size-5" aria-hidden="true" />
            Employee access
          </Link>
        </Button>
      </footer>
    </main>
  );
}
