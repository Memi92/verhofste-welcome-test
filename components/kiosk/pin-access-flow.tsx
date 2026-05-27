"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  startTransition,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
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

const SUCCESS_RETURN_TIMEOUT_SECONDS = 5;

type PinFlowStatus = "idle" | "checking" | "success" | "error";

export function PinAccessFlow() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [result, setResult] = useState<PinSubmitResult | null>(null);
  const [status, setStatus] = useState<PinFlowStatus>("idle");
  const [successCountdown, setSuccessCountdown] = useState(
    SUCCESS_RETURN_TIMEOUT_SECONDS
  );
  const [isPending, startSubmitTransition] = useTransition();
  const submitLockRef = useRef(false);
  const isChecking = status === "checking" || isPending;
  const isSuccess = status === "success";
  const isInputDisabled = isChecking || isSuccess;

  function appendDigit(digit: string) {
    if (isInputDisabled) {
      return;
    }

    setResult(null);
    setStatus("idle");
    setPin((current) => (current.length < 4 ? `${current}${digit}` : current));
  }

  function clearPin() {
    if (isInputDisabled) {
      return;
    }

    setPin("");
    setResult(null);
    setStatus("idle");
  }

  function removeLastDigit() {
    if (isInputDisabled) {
      return;
    }

    setResult(null);
    setStatus("idle");
    setPin((current) => current.slice(0, -1));
  }

  function submitPin(pinToSubmit = pin) {
    if (pinToSubmit.length !== 4 || isInputDisabled || submitLockRef.current) {
      return;
    }

    submitLockRef.current = true;
    setStatus("checking");

    startSubmitTransition(async () => {
      try {
        const actionResult = await submitPinAction(pinToSubmit);
        setResult(actionResult);

        if (actionResult.ok) {
          setStatus("success");
          setSuccessCountdown(SUCCESS_RETURN_TIMEOUT_SECONDS);
          setPin("");
          return;
        }

        submitLockRef.current = false;
        setStatus("error");
        setPin("");
      } catch {
        submitLockRef.current = false;
        setStatus("error");
        setPin("");
        setResult({
          ok: false,
          message: "PIN validation failed.",
        });
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
      if (isInputDisabled) {
        return;
      }

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

  useEffect(() => {
    if (status !== "success") {
      return;
    }

    const timer = setTimeout(() => {
      if (successCountdown <= 1) {
        router.push("/");
        return;
      }

      setSuccessCountdown(successCountdown - 1);
    }, 1000);

    return () => {
      clearTimeout(timer);
    };
  }, [router, status, successCountdown]);

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
                {result.ok ? (
                  <p className="mt-2 text-sm text-emerald-800">
                    Going back to start in {successCountdown}s
                  </p>
                ) : null}
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
                      disabled={isInputDisabled}
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

            {isSuccess ? (
              <div className="flex h-16 w-full items-center justify-center rounded-[8px] bg-emerald-50 text-lg font-semibold text-emerald-900 ring-1 ring-emerald-200">
                Access granted
              </div>
            ) : (
              <Button
                type="button"
                className="h-16 w-full rounded-[8px] bg-neutral-950 text-lg text-white hover:bg-neutral-800"
                disabled={pin.length !== 4 || isChecking}
                onClick={() => submitPin()}
              >
                {isChecking
                  ? "Checking PIN..."
                  : status === "error"
                    ? "Invalid PIN"
                    : "Open"}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
