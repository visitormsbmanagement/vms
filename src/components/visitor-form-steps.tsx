"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface FormStepsProps {
  currentStep: number;
  steps: string[];
}

export function VisitorFormSteps({ currentStep, steps }: FormStepsProps) {
  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = currentStep > stepNumber;
          const isCurrent = currentStep === stepNumber;

          return (
            <div key={step} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all sm:h-10 sm:w-10",
                    isCompleted &&
                      "border-primary bg-primary text-primary-foreground",
                    isCurrent &&
                      "border-primary bg-primary/10 text-primary ring-4 ring-primary/20",
                    !isCompleted &&
                      !isCurrent &&
                      "border-muted-foreground/30 text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4 sm:h-5 sm:w-5" />
                  ) : (
                    stepNumber
                  )}
                </div>
                <span
                  className={cn(
                    "hidden text-xs font-medium sm:block",
                    isCurrent && "text-primary",
                    isCompleted && "text-primary",
                    !isCompleted && !isCurrent && "text-muted-foreground"
                  )}
                >
                  {step}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "mx-2 h-0.5 flex-1 rounded-full transition-all sm:mx-3",
                    isCompleted ? "bg-primary" : "bg-muted-foreground/20"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
