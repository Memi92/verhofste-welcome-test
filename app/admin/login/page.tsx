import Link from "next/link";
import { ArrowLeft, LogIn, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";

import { loginAction } from "@/app/admin/login/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/server";

type AdminLoginPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function AdminLoginPage({
  searchParams,
}: AdminLoginPageProps) {
  const [params, supabase] = await Promise.all([searchParams, createClient()]);

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      redirect("/admin");
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-stone-50 p-6 text-neutral-950">
      <div className="w-full max-w-xl">
        <Button asChild variant="ghost" className="mb-6 h-12 rounded-[8px]">
          <Link href="/employee">
            <ArrowLeft className="size-5" aria-hidden="true" />
            Back to employee access
          </Link>
        </Button>

        <Card className="rounded-[8px] border-neutral-200 bg-white shadow-sm">
          <CardHeader className="gap-3 p-8 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-[8px] bg-neutral-100 text-neutral-700">
              <ShieldCheck className="size-7" aria-hidden="true" />
            </div>
            <CardTitle className="text-3xl font-semibold">
              Admin portal
            </CardTitle>
            <CardDescription className="text-base leading-7">
              Sign in with your Supabase admin user to manage employees.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 px-8 pb-8">
            {params.error ? (
              <Alert variant="destructive" className="rounded-[8px] p-4">
                <AlertTitle>Login failed</AlertTitle>
                <AlertDescription>{params.error}</AlertDescription>
              </Alert>
            ) : null}

            <form action={loginAction} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-base font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="h-14 rounded-[8px] text-lg md:text-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-base font-medium">
                  Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="h-14 rounded-[8px] text-lg md:text-lg"
                />
              </div>
              <Button
                type="submit"
                className="h-14 w-full rounded-[8px] bg-neutral-950 text-lg text-white hover:bg-neutral-800"
              >
                <LogIn className="size-5" aria-hidden="true" />
                Log in
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
