import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Image as ImageIcon,
  LogOut,
  RotateCcw,
  Save,
  UserMinus,
  UserPlus,
} from "lucide-react";

import {
  createEmployeeAction,
  deactivateEmployeeAction,
  logoutAdminAction,
  reactivateEmployeeAction,
  updateEmployeeAction,
} from "@/app/admin/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Employee } from "@/types";

type EmployeeManagerProps = {
  employees: Employee[];
  source: "supabase" | "mock";
  loadError?: string;
  savedMessage?: string;
  errorMessage?: string;
};

function EmployeeFields({ employee }: { employee?: Employee }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <div className="space-y-2">
        <Label htmlFor={employee ? `name-${employee.id}` : "name-new"}>
          Name
        </Label>
        <Input
          id={employee ? `name-${employee.id}` : "name-new"}
          name="name"
          defaultValue={employee?.name ?? ""}
          required
          className="h-11 rounded-[8px]"
        />
      </div>
      <div className="space-y-2">
        <Label
          htmlFor={
            employee ? `department-${employee.id}` : "department-new"
          }
        >
          Department
        </Label>
        <Input
          id={employee ? `department-${employee.id}` : "department-new"}
          name="department"
          defaultValue={employee?.department ?? ""}
          required
          className="h-11 rounded-[8px]"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={employee ? `function-${employee.id}` : "function-new"}>
          Function
        </Label>
        <Input
          id={employee ? `function-${employee.id}` : "function-new"}
          name="function"
          defaultValue={employee?.function ?? ""}
          required
          className="h-11 rounded-[8px]"
        />
      </div>
      <div className="space-y-2">
        <Label
          htmlFor={
            employee ? `extension-${employee.id}` : "extension-new"
          }
        >
          Extension
        </Label>
        <Input
          id={employee ? `extension-${employee.id}` : "extension-new"}
          name="phone_extension"
          defaultValue={employee?.phone_extension ?? ""}
          required
          className="h-11 rounded-[8px]"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={employee ? `image-${employee.id}` : "image-new"}>
          Image URL
        </Label>
        <div className="relative">
          <ImageIcon
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400"
            aria-hidden="true"
          />
          <Input
            id={employee ? `image-${employee.id}` : "image-new"}
            name="image_url"
            type="url"
            defaultValue={employee?.image_url ?? ""}
            className="h-11 rounded-[8px] pl-9"
            placeholder="https://..."
          />
        </div>
      </div>
    </div>
  );
}

export function EmployeeManager({
  employees,
  source,
  loadError,
  savedMessage,
  errorMessage,
}: EmployeeManagerProps) {
  return (
    <main className="min-h-dvh bg-stone-50 px-5 py-8 text-neutral-950 sm:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <Button asChild variant="ghost" className="h-12 w-fit rounded-[8px]">
          <Link href="/">
            <ArrowLeft className="size-5" aria-hidden="true" />
            Back to reception
          </Link>
        </Button>

        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge
              variant="outline"
              className="rounded-[8px] border-neutral-300 bg-white"
            >
              {source === "supabase" ? "Supabase employees" : "Mock fallback"}
            </Badge>
            <h1 className="mt-4 text-4xl font-semibold md:text-5xl">
              Employee management
            </h1>
            <p className="mt-3 max-w-2xl text-lg leading-7 text-neutral-600">
              Create, edit, deactivate, and reactivate reception directory
              employees.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-600">
            <span>{employees.length} employees</span>
            <form action={logoutAdminAction}>
              <Button
                type="submit"
                variant="outline"
                className="h-10 rounded-[8px]"
              >
                <LogOut className="size-4" aria-hidden="true" />
                Log out
              </Button>
            </form>
          </div>
        </header>

        {loadError ? (
          <Alert className="rounded-[8px] border-amber-200 bg-amber-50 p-4 text-amber-950">
            <AlertTitle>Using mock data</AlertTitle>
            <AlertDescription className="text-amber-800">
              Supabase could not be loaded: {loadError}
            </AlertDescription>
          </Alert>
        ) : null}

        {savedMessage ? (
          <Alert className="rounded-[8px] border-emerald-200 bg-emerald-50 p-4 text-emerald-950">
            <CheckCircle2 className="size-5" aria-hidden="true" />
            <AlertTitle>Saved</AlertTitle>
            <AlertDescription className="text-emerald-800">
              {savedMessage}
            </AlertDescription>
          </Alert>
        ) : null}

        {errorMessage ? (
          <Alert variant="destructive" className="rounded-[8px] p-4">
            <AlertTitle>Employee update failed</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : null}

        <Card className="rounded-[8px] border-neutral-200 bg-white shadow-sm">
          <CardHeader className="p-6">
            <CardTitle className="text-2xl font-semibold">
              Add employee
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <form action={createEmployeeAction} className="space-y-5">
              <EmployeeFields />
              <Button
                type="submit"
                className="h-11 rounded-[8px] bg-neutral-950 text-white hover:bg-neutral-800"
              >
                <UserPlus className="size-4" aria-hidden="true" />
                Create employee
              </Button>
            </form>
          </CardContent>
        </Card>

        <section className="space-y-4" aria-label="Employees">
          {employees.map((employee) => (
            <Card
              key={employee.id}
              className="rounded-[8px] border-neutral-200 bg-white shadow-sm"
            >
              <CardContent className="p-5 sm:p-6">
                <form action={updateEmployeeAction} className="space-y-5">
                  <input type="hidden" name="id" value={employee.id} />
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="break-words text-xl font-semibold">
                          {employee.name}
                        </h2>
                        <Badge
                          variant={employee.is_active ? "secondary" : "outline"}
                          className="rounded-[8px]"
                        >
                          {employee.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="mt-1 break-words text-sm text-neutral-600">
                        {employee.department} - {employee.function}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="submit"
                        variant="outline"
                        className="h-10 rounded-[8px]"
                      >
                        <Save className="size-4" aria-hidden="true" />
                        Save
                      </Button>
                    </div>
                  </div>
                  <EmployeeFields employee={employee} />
                </form>

                <form
                  action={
                    employee.is_active
                      ? deactivateEmployeeAction
                      : reactivateEmployeeAction
                  }
                  className="mt-4 border-t border-neutral-100 pt-4"
                >
                  <input type="hidden" name="id" value={employee.id} />
                  <Button
                    type="submit"
                    variant={employee.is_active ? "destructive" : "outline"}
                    className="h-10 rounded-[8px]"
                  >
                    {employee.is_active ? (
                      <UserMinus className="size-4" aria-hidden="true" />
                    ) : (
                      <RotateCcw className="size-4" aria-hidden="true" />
                    )}
                    {employee.is_active ? "Deactivate" : "Reactivate"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          ))}
        </section>
      </div>
    </main>
  );
}
