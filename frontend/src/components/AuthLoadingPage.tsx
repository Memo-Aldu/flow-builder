"use client";

import { Loader2 } from "lucide-react";
import { Logo } from "./Logo";

interface AuthLoadingPageProps {
  message?: string;
}

export function AuthLoadingPage({ message = "Setting up your account..." }: AuthLoadingPageProps) {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <Logo iconSize={48} fontSize="text-3xl" />
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">{message}</h2>
            <p className="text-muted-foreground">Please wait while we prepare your workspace</p>
          </div>
        </div>
      </div>
    </div>
  );
}
