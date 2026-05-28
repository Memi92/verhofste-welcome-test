"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Phone,
  Search,
  UserRound,
} from "lucide-react";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OnScreenKeyboard } from "@/components/kiosk/on-screen-keyboard";
import {
  callEmployeeAction,
  getPhoneCallStatusAction,
  logMockCallEventAction,
  logThreeCxCallStatusEventAction,
} from "@/app/visitor/actions";
import { callReceptionMock } from "@/lib/mockHardware";
import type { Employee } from "@/types";

type VisitorFlowProps = {
  employees: Employee[];
};

type MockCallStatus =
  | "calling"
  | "ringing"
  | "connected"
  | "ended"
  | "cancelled"
  | "failed";

type MockCallTarget = "employee" | "reception";

const NO_ANSWER_TIMEOUT_MS = 5000;
const NO_ANSWER_DECISION_TIMEOUT_SECONDS = 20;
const ENDED_CALL_RETURN_TIMEOUT_SECONDS = 10;
const THREECX_STATUS_POLL_INTERVAL_MS = 1000;

const callStatusCopy: Record<
  MockCallStatus,
  { title: string; description: string }
> = {
  calling: {
    title: "Notifying your host...",
    description: "We are preparing the mocked call request.",
  },
  ringing: {
    title: "Calling your host...",
    description: "This is a simulated ringing state for the kiosk milestone.",
  },
  connected: {
    title: "Connected. You may speak now.",
    description: "The mock call will stay open until you end it.",
  },
  ended: {
    title: "Call ended. Thank you.",
    description: "The mocked call lifecycle has finished.",
  },
  cancelled: {
    title: "Call cancelled.",
    description: "No further mock call action is running.",
  },
  failed: {
    title: "We could not notify your host. Please try again or contact reception.",
    description: "The mocked call request failed.",
  },
};

export function VisitorFlow({ employees }: VisitorFlowProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );
  const [callStatus, setCallStatus] = useState<MockCallStatus | null>(null);
  const [callTarget, setCallTarget] = useState<MockCallTarget>("employee");
  const [isNoAnswerOpen, setIsNoAnswerOpen] = useState(false);
  const [noAnswerDecisionCountdown, setNoAnswerDecisionCountdown] = useState(
    NO_ANSWER_DECISION_TIMEOUT_SECONDS
  );
  const [endedCountdown, setEndedCountdown] = useState(
    ENDED_CALL_RETURN_TIMEOUT_SECONDS
  );
  const callRunIdRef = useRef(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const hasLoggedThreeCxConnectedRef = useRef(false);
  const hasLoggedThreeCxEndedRef = useRef(false);

  function clearCallTimers() {
    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current = [];
  }

  function logThreeCxConnectedOnce(employeeId: Employee["id"]) {
    if (hasLoggedThreeCxConnectedRef.current) {
      return;
    }

    hasLoggedThreeCxConnectedRef.current = true;
    void logThreeCxCallStatusEventAction(
      "call_connected_3cx",
      employeeId
    ).catch(() => undefined);
  }

  function logThreeCxEndedOnce(employeeId: Employee["id"]) {
    if (hasLoggedThreeCxEndedRef.current) {
      return;
    }

    hasLoggedThreeCxEndedRef.current = true;
    void logThreeCxCallStatusEventAction("call_ended_3cx", employeeId).catch(
      () => undefined
    );
  }

  useEffect(() => {
    return () => {
      clearCallTimers();
    };
  }, []);

  const filteredEmployees = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return employees.filter((employee) => {
      const matchesDepartment =
        selectedDepartment === "all" ||
        employee.department === selectedDepartment;
      const matchesQuery =
        !normalizedQuery ||
        employee.name.toLowerCase().includes(normalizedQuery);

      return matchesDepartment && matchesQuery;
    });
  }, [employees, query, selectedDepartment]);

  const departments = useMemo(() => {
    const uniqueDepartments = new Set<string>();

    employees.forEach((employee) => {
      const department = employee.department.trim();

      if (employee.is_active && department) {
        uniqueDepartments.add(department);
      }
    });

    return Array.from(uniqueDepartments).sort((first, second) =>
      first.localeCompare(second)
    );
  }, [employees]);

  function resetFlow() {
    callRunIdRef.current += 1;
    clearCallTimers();
    setSelectedEmployee(null);
    setCallStatus(null);
    setCallTarget("employee");
    setIsNoAnswerOpen(false);
    setNoAnswerDecisionCountdown(NO_ANSWER_DECISION_TIMEOUT_SECONDS);
    setEndedCountdown(ENDED_CALL_RETURN_TIMEOUT_SECONDS);
    hasLoggedThreeCxConnectedRef.current = false;
    hasLoggedThreeCxEndedRef.current = false;
  }

  function scheduleMockCallTimers(callRunId: number) {
    timersRef.current.push(
      setTimeout(() => {
        if (callRunIdRef.current === callRunId) {
          setCallStatus("ringing");
        }
      }, 1000)
    );

    timersRef.current.push(
      setTimeout(() => {
        if (callRunIdRef.current === callRunId) {
          setCallStatus((currentStatus) => {
            if (currentStatus === "calling" || currentStatus === "ringing") {
              setNoAnswerDecisionCountdown(
                NO_ANSWER_DECISION_TIMEOUT_SECONDS
              );
              setIsNoAnswerOpen(true);
            }

            return currentStatus;
          });
        }
      }, NO_ANSWER_TIMEOUT_MS)
    );
  }

  function applyThreeCxStatus(
    employee: Employee,
    callRunId: number,
    status: Awaited<ReturnType<typeof getPhoneCallStatusAction>>["status"]
  ) {
    if (callRunIdRef.current !== callRunId) {
      return;
    }

    if (status === "connected") {
      setIsNoAnswerOpen(false);
      setCallStatus("connected");
      logThreeCxConnectedOnce(employee.id);
      return;
    }

    if (
      (status === "ended" || status === "idle") &&
      hasLoggedThreeCxConnectedRef.current
    ) {
      clearCallTimers();
      setIsNoAnswerOpen(false);
      setCallStatus("ended");
      setEndedCountdown(ENDED_CALL_RETURN_TIMEOUT_SECONDS);
      logThreeCxEndedOnce(employee.id);
      return;
    }

    if (status === "failed") {
      clearCallTimers();
      setCallStatus("failed");
      return;
    }

    if (status === "ringing") {
      setCallStatus("ringing");
      return;
    }

    if (status === "calling") {
      setCallStatus("calling");
    }
  }

  function pollThreeCxStatus(employee: Employee, callRunId: number) {
    void getPhoneCallStatusAction(employee.id)
      .then((result) => {
        applyThreeCxStatus(
          employee,
          callRunId,
          result.ok ? result.status : "failed"
        );
      })
      .catch(() => {
        applyThreeCxStatus(employee, callRunId, "failed");
      });
  }

  function scheduleThreeCxStatusPolling(employee: Employee, callRunId: number) {
    setCallStatus("ringing");
    pollThreeCxStatus(employee, callRunId);

    timersRef.current.push(
      setInterval(() => {
        pollThreeCxStatus(employee, callRunId);
      }, THREECX_STATUS_POLL_INTERVAL_MS)
    );

    timersRef.current.push(
      setTimeout(() => {
        if (callRunIdRef.current !== callRunId) {
          return;
        }

        void getPhoneCallStatusAction(employee.id)
          .then((result) => {
            const status = result.ok ? result.status : "failed";

            applyThreeCxStatus(employee, callRunId, status);

            if (
              callRunIdRef.current === callRunId &&
              status !== "connected" &&
              status !== "ended" &&
              status !== "idle" &&
              status !== "failed"
            ) {
              setNoAnswerDecisionCountdown(
                NO_ANSWER_DECISION_TIMEOUT_SECONDS
              );
              setIsNoAnswerOpen(true);
            }
          })
          .catch(() => {
            applyThreeCxStatus(employee, callRunId, "failed");
          });
      }, NO_ANSWER_TIMEOUT_MS)
    );
  }

  function startMockCall(employee: Employee) {
    callRunIdRef.current += 1;
    clearCallTimers();

    const callRunId = callRunIdRef.current;

    setSelectedEmployee(employee);
    setCallTarget("employee");
    setIsNoAnswerOpen(false);
    setNoAnswerDecisionCountdown(NO_ANSWER_DECISION_TIMEOUT_SECONDS);
    setEndedCountdown(ENDED_CALL_RETURN_TIMEOUT_SECONDS);
    setCallStatus("calling");
    hasLoggedThreeCxConnectedRef.current = false;
    hasLoggedThreeCxEndedRef.current = false;

    callEmployeeAction(employee.id).then((result) => {
      if (!result.ok && callRunIdRef.current === callRunId) {
        clearCallTimers();
        setCallStatus("failed");
      }

      if (callRunIdRef.current !== callRunId || !result.ok) {
        return;
      }

      if (result.provider === "3cx") {
        scheduleThreeCxStatusPolling(employee, callRunId);
        return;
      }

      scheduleMockCallTimers(callRunId);
    }).catch(() => {
      if (callRunIdRef.current === callRunId) {
        clearCallTimers();
        setCallStatus("failed");
      }
    });
  }

  function cancelMockCall() {
    const employeeId = selectedEmployee?.id;

    callRunIdRef.current += 1;
    clearCallTimers();
    setCallStatus("cancelled");

    if (employeeId) {
      void logMockCallEventAction("call_cancelled_mock", employeeId).catch(
        () => undefined
      );
    }
  }

  function endMockCall() {
    const employeeId =
      callTarget === "employee" ? selectedEmployee?.id ?? null : null;

    callRunIdRef.current += 1;
    clearCallTimers();
    setCallStatus("ended");
    setEndedCountdown(ENDED_CALL_RETURN_TIMEOUT_SECONDS);

    if (employeeId || callTarget === "reception") {
      void logMockCallEventAction("call_ended_mock", employeeId).catch(
        () => undefined
      );
    }
  }

  function logEmployeeCallCancelled() {
    const employeeId = selectedEmployee?.id;

    if (employeeId) {
      void logMockCallEventAction("call_cancelled_mock", employeeId).catch(
        () => undefined
      );
    }
  }

  function callReceptionFallback() {
    callRunIdRef.current += 1;
    clearCallTimers();
    setIsNoAnswerOpen(false);
    setNoAnswerDecisionCountdown(NO_ANSWER_DECISION_TIMEOUT_SECONDS);
    logEmployeeCallCancelled();

    const callRunId = callRunIdRef.current;

    setCallTarget("reception");
    setCallStatus("calling");
    void logMockCallEventAction("call_reception_mock", null).catch(
      () => undefined
    );

    callReceptionMock().catch(() => {
      if (callRunIdRef.current === callRunId) {
        setCallStatus("failed");
      }
    });

    timersRef.current.push(
      setTimeout(() => {
        if (callRunIdRef.current === callRunId) {
          setCallStatus("connected");
          void logMockCallEventAction("call_connected_mock", null).catch(
            () => undefined
          );
        }
      }, 2000)
    );
  }

  function noAnswerBackToStart() {
    callRunIdRef.current += 1;
    clearCallTimers();
    setIsNoAnswerOpen(false);
    setNoAnswerDecisionCountdown(NO_ANSWER_DECISION_TIMEOUT_SECONDS);
    logEmployeeCallCancelled();
    router.push("/");
  }

  useEffect(() => {
    if (!isNoAnswerOpen) {
      return;
    }

    const timer = setTimeout(() => {
      if (noAnswerDecisionCountdown <= 1) {
        callRunIdRef.current += 1;
        clearCallTimers();
        setIsNoAnswerOpen(false);
        setNoAnswerDecisionCountdown(NO_ANSWER_DECISION_TIMEOUT_SECONDS);

        void logMockCallEventAction(
          "call_no_answer_timeout_mock",
          selectedEmployee?.id ?? null
        ).catch(() => undefined);

        router.push("/");
        return;
      }

      setNoAnswerDecisionCountdown(noAnswerDecisionCountdown - 1);
    }, 1000);

    return () => {
      clearTimeout(timer);
    };
  }, [isNoAnswerOpen, noAnswerDecisionCountdown, router, selectedEmployee?.id]);

  useEffect(() => {
    if (callStatus !== "ended") {
      return;
    }

    if (endedCountdown <= 0) {
      router.push("/");
      return;
    }

    const timer = setTimeout(() => {
      setEndedCountdown((currentValue) => currentValue - 1);
    }, 1000);

    return () => {
      clearTimeout(timer);
    };
  }, [callStatus, endedCountdown, router]);

  if (selectedEmployee) {
    const hasCallStarted = callStatus !== null;

    return (
      <main className="min-h-dvh bg-stone-50 px-5 py-6 text-neutral-950 sm:px-8">
        <div className="mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-4xl flex-col">
          <Button
            asChild
            variant="ghost"
            className="mb-6 h-12 w-fit rounded-[8px] px-4 text-base"
          >
            <Link href="/visitor" onClick={resetFlow}>
              <ArrowLeft className="size-5" aria-hidden="true" />
              Choose another employee
            </Link>
          </Button>

          <Card className="my-auto rounded-[8px] border-neutral-200 bg-white shadow-sm">
            <CardHeader className="gap-3 p-8 text-center">
              <div className="mx-auto flex size-16 items-center justify-center rounded-[8px] bg-emerald-50 text-emerald-700">
                {callStatus === "ended" ? (
                  <CheckCircle2 className="size-9" aria-hidden="true" />
                ) : (
                  <Phone className="size-9" aria-hidden="true" />
                )}
              </div>
              <CardTitle className="text-3xl font-semibold md:text-4xl">
                {callTarget === "reception" &&
                (callStatus === "calling" || callStatus === "ringing")
                  ? "Calling reception..."
                  : hasCallStarted
                    ? callStatusCopy[callStatus].title
                    : "Confirm your host"}
              </CardTitle>
              <CardDescription className="mx-auto max-w-2xl text-lg leading-7">
                {hasCallStarted
                  ? callTarget === "reception" &&
                    (callStatus === "calling" || callStatus === "ringing")
                    ? "We are placing a mocked call to reception."
                    : callStatusCopy[callStatus].description
                  : "Please confirm before starting the mocked call."}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 px-8 pb-8">
              <div className="rounded-[8px] border border-neutral-200 bg-neutral-50 p-6 text-center">
                <p className="text-3xl font-semibold text-neutral-950">
                  {callTarget === "reception"
                    ? "Reception"
                    : selectedEmployee.name}
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                  <Badge
                    variant="secondary"
                    className="h-8 rounded-[8px] px-3 text-sm"
                  >
                    {callTarget === "reception"
                      ? "Reception"
                      : selectedEmployee.department}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="h-8 rounded-[8px] px-3 text-sm"
                  >
                    {callTarget === "reception"
                      ? "Front desk"
                      : selectedEmployee.function}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="h-8 rounded-[8px] px-3 text-sm"
                  >
                    {callTarget === "reception"
                      ? "Fallback call"
                      : `Extension ${selectedEmployee.phone_extension}`}
                  </Badge>
                </div>
              </div>

              {!hasCallStarted ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Button
                    type="button"
                    className="h-16 rounded-[8px] bg-neutral-950 text-lg text-white hover:bg-neutral-800"
                    onClick={() => startMockCall(selectedEmployee)}
                  >
                    Call
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-16 rounded-[8px] text-lg"
                    onClick={resetFlow}
                  >
                    Go back
                  </Button>
                </div>
              ) : null}

              {callStatus === "connected" ? (
                <Alert className="rounded-[8px] border-emerald-200 bg-emerald-50 p-4 text-emerald-950">
                  <CheckCircle2 className="size-5" aria-hidden="true" />
                  <AlertTitle>Mock call connected</AlertTitle>
                  <AlertDescription className="text-emerald-800">
                    Stay on this screen while speaking with your host.
                  </AlertDescription>
                </Alert>
              ) : null}

              {callStatus === "failed" ? (
                <Alert variant="destructive" className="rounded-[8px] p-4">
                  <AlertTitle>Mock call failed</AlertTitle>
                  <AlertDescription>
                    We could not notify your host. Please try again or contact
                    reception.
                  </AlertDescription>
                </Alert>
              ) : null}

              {callStatus === "calling" || callStatus === "ringing" ? (
                <Button
                  type="button"
                  variant="outline"
                  className="h-16 w-full rounded-[8px] text-lg"
                  onClick={cancelMockCall}
                >
                  Cancel
                </Button>
              ) : null}

              {callStatus === "connected" ? (
                <Button
                  type="button"
                  className="h-16 w-full rounded-[8px] bg-neutral-950 text-lg text-white hover:bg-neutral-800"
                  onClick={endMockCall}
                >
                  End mock call
                </Button>
              ) : null}

              {callStatus === "ended" ||
              callStatus === "cancelled" ||
              callStatus === "failed" ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-16 rounded-[8px] text-lg"
                    onClick={() => startMockCall(selectedEmployee)}
                  >
                    Try again
                  </Button>
                  <Button
                    asChild
                    className="h-16 rounded-[8px] bg-neutral-950 text-lg text-white hover:bg-neutral-800"
                  >
                    <Link href="/">Back to start</Link>
                  </Button>
                  {callStatus === "ended" ? (
                    <p className="text-center text-sm text-neutral-500 sm:col-span-2">
                      Going back to start in {endedCountdown}s
                    </p>
                  ) : null}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
        <Dialog
          open={isNoAnswerOpen}
          onOpenChange={(open) => {
            if (open) {
              setIsNoAnswerOpen(true);
            }
          }}
        >
          <DialogContent
            className="rounded-[8px] p-6 sm:max-w-lg"
            showCloseButton={false}
          >
            <DialogHeader>
              <DialogTitle className="text-2xl">No answer yet</DialogTitle>
              <DialogDescription className="text-base leading-7">
                Would you like to call reception instead?
              </DialogDescription>
              <p className="text-sm text-neutral-500">
                Returning to start in {noAnswerDecisionCountdown}s
              </p>
            </DialogHeader>
            <DialogFooter className="-mx-6 -mb-6 p-6 sm:justify-stretch">
              <Button
                type="button"
                className="h-14 flex-1 rounded-[8px] bg-neutral-950 text-base text-white hover:bg-neutral-800"
                onClick={callReceptionFallback}
              >
                Yes, call reception
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-14 flex-1 rounded-[8px] text-base"
                onClick={noAnswerBackToStart}
              >
                No, back to start
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-stone-50 px-5 py-6 text-neutral-950 sm:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Button
              asChild
              variant="ghost"
              className="mb-4 h-12 rounded-[8px] px-4 text-base"
            >
              <Link href="/">
                <ArrowLeft className="size-5" aria-hidden="true" />
                Back
              </Link>
            </Button>
            <h1 className="text-4xl font-semibold md:text-5xl">
              Who are you visiting?
            </h1>
            <p className="mt-3 max-w-2xl text-lg leading-7 text-neutral-600">
              Search for your host or tap one of the employee cards below.
            </p>
          </div>
          <Badge
            variant="outline"
            className="h-9 w-fit rounded-[8px] border-emerald-200 bg-emerald-50 px-3 text-sm text-emerald-800"
          >
            Mock employee directory
          </Badge>
        </header>

        <Card className="rounded-[8px] border-neutral-200 bg-white shadow-sm">
          <CardContent className="p-5 sm:p-6">
            <div className="space-y-3">
              <Label htmlFor="employee-search" className="text-lg font-medium">
                Search by name
              </Label>
              <div
                className="relative"
                onClick={() => setIsKeyboardVisible(true)}
              >
                <Search
                  className="pointer-events-none absolute left-5 top-1/2 size-6 -translate-y-1/2 text-neutral-400"
                  aria-hidden="true"
                />
                <Input
                  id="employee-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onFocus={() => setIsKeyboardVisible(true)}
                  placeholder="Start typing a name"
                  className="h-16 rounded-[8px] border-neutral-300 pl-14 text-xl md:text-xl"
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="mt-6 space-y-3 border-t border-neutral-100 pt-5">
              <p className="text-sm font-medium text-neutral-600">
                Filter by department
              </p>
              <div className="flex flex-wrap gap-2" aria-label="Departments">
                <button
                  type="button"
                  aria-pressed={selectedDepartment === "all"}
                  className="min-h-11 rounded-[8px] border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm transition hover:border-neutral-300 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-neutral-400 active:translate-y-px aria-pressed:border-neutral-950 aria-pressed:bg-neutral-950 aria-pressed:text-white"
                  onClick={() => setSelectedDepartment("all")}
                >
                  All
                </button>
                {departments.map((department) => (
                  <button
                    key={department}
                    type="button"
                    aria-pressed={selectedDepartment === department}
                    className="min-h-11 max-w-full rounded-[8px] border border-neutral-200 bg-white px-4 py-2 text-left text-sm font-medium text-neutral-700 shadow-sm transition hover:border-neutral-300 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-neutral-400 active:translate-y-px aria-pressed:border-neutral-950 aria-pressed:bg-neutral-950 aria-pressed:text-white"
                    onClick={() => setSelectedDepartment(department)}
                  >
                    <span className="block break-words">{department}</span>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {isKeyboardVisible ? (
          <OnScreenKeyboard
            value={query}
            onChange={setQuery}
            onHide={() => setIsKeyboardVisible(false)}
          />
        ) : null}

        <section
          className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
          aria-label="Employee list"
        >
          {filteredEmployees.map((employee) => (
            <button
              key={employee.id}
              type="button"
              aria-label={`Notify ${employee.name}`}
              className="group flex min-h-52 w-full flex-col justify-between rounded-[8px] border border-neutral-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-neutral-400 active:translate-y-px"
              onClick={() => setSelectedEmployee(employee)}
            >
              <div className="flex min-w-0 items-start gap-4">
                <div className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-[8px] border border-neutral-200 bg-neutral-50 text-neutral-500 transition group-hover:border-neutral-300 group-hover:bg-neutral-100 group-hover:text-neutral-700">
                  {employee.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={employee.image_url}
                      alt=""
                      className="absolute inset-0 size-full object-cover"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />
                  ) : null}
                  <UserRound className="size-7" aria-hidden="true" />
                </div>

                <div className="min-w-0 flex-1 space-y-3">
                  <div className="space-y-2">
                    <p className="break-words text-2xl font-semibold leading-tight text-neutral-950">
                      {employee.name}
                    </p>
                    <span className="inline-flex max-w-full rounded-[8px] border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs font-medium leading-5 text-neutral-600">
                      <span className="min-w-0 break-words">
                        {employee.department}
                      </span>
                    </span>
                  </div>

                  <p className="break-words text-base leading-7 text-neutral-600">
                    {employee.function}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 pt-4 text-sm text-neutral-500">
                <span className="inline-flex items-center gap-2 font-medium">
                  <Phone className="size-4" aria-hidden="true" />
                  Extension {employee.phone_extension}
                </span>
                <span className="font-medium text-neutral-400 transition group-hover:text-neutral-600">
                  Tap to notify
                </span>
              </div>
            </button>
          ))}
        </section>

        {filteredEmployees.length === 0 ? (
          <Alert className="rounded-[8px] bg-white p-5">
            <AlertTitle>No employee found</AlertTitle>
            <AlertDescription>
              Check the spelling or return to the start screen for assistance.
            </AlertDescription>
          </Alert>
        ) : null}
      </div>
    </main>
  );
}
