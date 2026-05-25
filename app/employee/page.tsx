import Link from "next/link";
import { ArrowLeft, KeyRound, Settings, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const employeeActions = [
  {
    title: "Open door",
    description: "Use the employee PIN access placeholder.",
    href: "/pin",
    icon: KeyRound,
  },
  {
    title: "Admin portal",
    description: "Sign in to manage the employee directory.",
    href: "/admin/login",
    icon: Settings,
  },
];

export default function EmployeeAccessPage() {
  return (
    <main className="min-h-dvh bg-stone-50 px-5 py-6 text-neutral-950 sm:px-8">
      <div className="mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-5xl flex-col">
        <Button asChild variant="ghost" className="mb-8 h-12 w-fit rounded-[8px]">
          <Link href="/">
            <ArrowLeft className="size-5" aria-hidden="true" />
            Back to reception
          </Link>
        </Button>

        <section className="my-auto space-y-8">
          <header className="text-center">
            <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-[8px] bg-neutral-100 text-neutral-700">
              <ShieldCheck className="size-8" aria-hidden="true" />
            </div>
            <h1 className="text-4xl font-semibold md:text-5xl">
              Employee access
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-7 text-neutral-600">
              Employees can choose the action they need from this screen.
            </p>
          </header>

          <div className="grid gap-4 md:grid-cols-2">
            {employeeActions.map((action) => {
              const Icon = action.icon;

              return (
                <Link
                  key={action.title}
                  href={action.href}
                  className="rounded-[8px] border border-neutral-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-neutral-300 hover:bg-neutral-50 hover:shadow-md focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-neutral-400 active:translate-y-px"
                >
                  <Card className="w-full rounded-[8px] border-0 bg-transparent shadow-none">
                    <CardHeader className="gap-4 p-7">
                      <div className="flex size-14 items-center justify-center rounded-[8px] bg-neutral-100 text-neutral-700">
                        <Icon className="size-7" aria-hidden="true" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl font-semibold">
                          {action.title}
                        </CardTitle>
                        <CardDescription className="mt-2 text-base leading-7">
                          {action.description}
                        </CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="px-7 pb-7 text-sm font-medium text-neutral-500">
                      Tap to continue
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
