import Link from "next/link";
import { ArrowLeft, KeyRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function PinPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-stone-50 p-6 text-neutral-950">
      <Card className="w-full max-w-xl rounded-[8px] border-neutral-200 bg-white shadow-sm">
        <CardHeader className="gap-3 p-8 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-[8px] bg-neutral-100 text-neutral-700">
            <KeyRound className="size-7" aria-hidden="true" />
          </div>
          <Badge variant="outline" className="mx-auto rounded-[8px]">
            Next milestone
          </Badge>
          <CardTitle className="text-3xl font-semibold">
            Employee PIN access
          </CardTitle>
          <CardDescription className="text-base leading-7">
            PIN entry will validate employee access codes in a later milestone.
            Door opening remains mocked and is not connected to hardware yet.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <Button asChild variant="outline" className="h-14 w-full rounded-[8px]">
            <Link href="/employee">
              <ArrowLeft className="size-5" aria-hidden="true" />
              Back to employee access
            </Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
