import Link from "next/link";
import { ArrowLeft, ClipboardList, LockKeyhole, UsersRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const adminPlaceholders = [
  {
    title: "Supabase Auth login",
    description: "Admin authentication will be added before real data access.",
    icon: LockKeyhole,
  },
  {
    title: "Employee management",
    description: "Create, edit, and deactivate employees in a later milestone.",
    icon: UsersRound,
  },
  {
    title: "Event logs",
    description: "Review mocked calls and door requests once logging is wired.",
    icon: ClipboardList,
  },
];

export function AdminPlaceholder() {
  return (
    <main className="min-h-dvh bg-stone-50 px-5 py-8 text-neutral-950 sm:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <Button asChild variant="ghost" className="h-12 w-fit rounded-[8px]">
          <Link href="/">
            <ArrowLeft className="size-5" aria-hidden="true" />
            Back to reception
          </Link>
        </Button>

        <header>
          <Badge variant="outline" className="rounded-[8px]">
            Admin placeholder
          </Badge>
          <h1 className="mt-4 text-4xl font-semibold md:text-5xl">
            Reception admin
          </h1>
          <p className="mt-3 max-w-2xl text-lg leading-7 text-neutral-600">
            This route is reserved for Supabase-backed administration after the
            kiosk flow is stable.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {adminPlaceholders.map((item) => {
            const Icon = item.icon;

            return (
              <Card
                key={item.title}
                className="rounded-[8px] border-neutral-200 bg-white shadow-sm"
              >
                <CardHeader className="gap-4 p-6">
                  <div className="flex size-12 items-center justify-center rounded-[8px] bg-neutral-100 text-neutral-700">
                    <Icon className="size-6" aria-hidden="true" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-semibold">
                      {item.title}
                    </CardTitle>
                    <CardDescription className="mt-2 text-base leading-7">
                      {item.description}
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </section>
      </div>
    </main>
  );
}
