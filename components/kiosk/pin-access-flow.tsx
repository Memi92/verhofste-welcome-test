"use client";

import Link from "next/link";
import { startTransition, useEffect, useState, useTransition } from "react";
import { ArrowLeft, CheckCircle2, Delete, KeyRound, XCircle } from "lucide-react";

import { submitPinAction, type PinSubmitResult } from "@/app/pin/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const keypadRows = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["Clear", "0", "Back"],
];

export function PinAccessFlow() {
  const [pin, setPin] = useState("");
  const [result, setResult] = useState<PinSubmitResult | null>(null);
  const [isPending, startSubmitTransition] = useTransition();

  function appendDigit(digit: string) {
    setResult(null);
    setPin((current) => (current.length < 4 ? `${current}${digit}` : current));
  }

  function clearPin() {
    setPin("");
    setResult(null);
  }

  function removeLastDigit() {
    setResult(null);
    setPin((current) => current.slice(0, -1));
  }

  function submitPin(pinToSubmit = pin) {
    if (pinToSubmit.length !== 4 || isPending) {
      return;
    }

    startSubmitTransition(async () => {
      const actionResult = await submitPinAction(pinToSubmit);
      setResult(actionResult);

      if (!actionResult.ok) {
        setPin("");
      }
    });
  }

  function handleKeyPress(value: string) {
    if (/^\d$/.test(value)) {
      const nextPin = pin.length < 4 ? `${pin}${value}` : pin;
      appendDigit(value);

      if (nextPin.length === 4) {
        startTransition(() => submitPin(nextPin));
      }
      return;
    }

    if (value === "Clear") {
      clearPin();
      return;
    }

    removeLastDigit();
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (/^\d$/.test(event.key)) {
        handleKeyPress(event.key);
      }

      if (event.key === "Backspace") {
        removeLastDigit();
      }

      if (event.key === "Enter") {
        submitPin();
      }

      if (event.key === "Escape") {
        clearPin();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  });

  return (
    <main className="min-h-dvh bg-stone-50 px-5 py-6 text-neutral-950 sm:px-8">
      <div className="mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-3xl flex-col">
        <Button asChild variant="ghost" className="mb-6 h-12 w-fit rounded-[8px]">
          <Link href="/employee">
            <ArrowLeft className="size-5" aria-hidden="true" />
            Back to employee access
          </Link>
        </Button>

        <Card className="my-auto rounded-[8px] border-neutral-200 bg-white shadow-sm">
          <CardHeader className="gap-3 p-8 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-[8px] bg-neutral-100 text-neutral-700">
              <KeyRound className="size-7" aria-hidden="true" />
            </div>
            <CardTitle className="text-3xl font-semibold md:text-4xl">
              Employee access
            </CardTitle>
            <CardDescription className="text-lg leading-7">
              Enter your 4-digit PIN
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 px-8 pb-8">
            <div
              className="flex h-20 items-center justify-center gap-4 rounded-[8px] border border-neutral-200 bg-neutral-50"
              aria-label="PIN entry"
            >
              {Array.from({ length: 4 }).map((_, index) => (
                <span
                  key={index}
                  className={`size-5 rounded-full border border-neutral-300 ${
                    index < pin.length ? "bg-neutral-950" : "bg-white"
                  }`}
                />
              ))}
            </div>

            {result ? (
              <Alert
                variant={result.ok ? "default" : "destructive"}
                className={`rounded-[8px] p-4 ${
                  result.ok
                    ? "border-emerald-200 bg-emerald-50 text-emerald-950"
                    : ""
                }`}
              >
                {result.ok ? (
                  <CheckCircle2 className="size-5" aria-hidden="true" />
                ) : (
                  <XCircle className="size-5" aria-hidden="true" />
                )}
                <AlertTitle>{result.ok ? "Access granted" : "Invalid PIN"}</AlertTitle>
                <AlertDescription
                  className={result.ok ? "text-emerald-800" : undefined}
                >
                  {result.ok
                    ? `Welcome, ${result.employeeName}. ${result.message}`
                    : result.message}
                </AlertDescription>
              </Alert>
            ) : null}

            <div className="grid gap-3">
              {keypadRows.map((row) => (
                <div key={row.join("-")} className="grid grid-cols-3 gap-3">
                  {row.map((value) => (
                    <Button
                      key={value}
                      type="button"
                      variant={/^\d$/.test(value) ? "outline" : "secondary"}
                      className="h-16 rounded-[8px] text-xl font-semibold"
                      disabled={isPending}
                      onClick={() => handleKeyPress(value)}
                    >
                      {value === "Back" ? (
                        <Delete className="size-5" aria-hidden="true" />
                      ) : (
                        value
                      )}
                    </Button>
                  ))}
                </div>
              ))}
            </div>

            <Button
              type="button"
              className="h-16 w-full rounded-[8px] bg-neutral-950 text-lg text-white hover:bg-neutral-800"
              disabled={pin.length !== 4 || isPending}
              onClick={() => submitPin()}
            >
              {isPending ? "Checking PIN..." : "Open"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
