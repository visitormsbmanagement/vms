"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function SuccessContent() {
  const searchParams = useSearchParams();
  const name = searchParams.get("name") || "Visitor";

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md text-center">
        <CardContent className="flex flex-col items-center gap-6 pt-8 pb-8">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">
              Registration Successful!
            </h1>
            <p className="text-lg text-muted-foreground">
              Welcome, <span className="font-semibold text-foreground">{name}</span>
            </p>
          </div>

          <div className="space-y-3 text-sm text-muted-foreground">
            <p>A confirmation email has been sent to your email address.</p>
            <p className="font-medium text-foreground">
              You may now proceed to the reception.
            </p>
          </div>

          <Link href="/visit" className="w-full">
            <Button className="h-12 w-full gap-2 text-base">
              Register Another Visitor
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-muted/40">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
