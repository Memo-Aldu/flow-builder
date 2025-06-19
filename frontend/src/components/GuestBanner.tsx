"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GuestSessionManager } from "@/lib/api/guest";
import { AlertTriangle, Clock, UserPlus, X, Zap } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "./ui/alert";

interface GuestBannerProps {
  credits?: number;
  onDismiss?: () => void;
  className?: string;
}

export function GuestBanner({ credits, onDismiss, className }: GuestBannerProps) {
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const days = GuestSessionManager.getDaysRemaining();
    setDaysRemaining(days);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) return null;

  return (
    <Card className={`border-primary/20 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">Guest Mode</span>
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                Trial
              </Badge>
            </div>
            
            <div className="hidden sm:flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Zap className="h-4 w-4" />
                <span>{credits} credits remaining</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{daysRemaining} days left</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/sign-up">
              <Button size="sm" className="bg-primary hover:bg-primary/90">
                Create Account
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button size="sm" variant="outline" className="border-primary/30 text-primary hover:bg-primary/10">
                Sign In
              </Button>
            </Link>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDismiss}
              className="text-muted-foreground hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mobile layout */}
        <div className="sm:hidden mt-3 flex items-center justify-between text-sm text-orange-700">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Zap className="h-4 w-4" />
              <span>{credits} credits</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{daysRemaining} days</span>
            </div>
          </div>
        </div>

        {daysRemaining <= 1 && (
          <Alert variant="destructive" className="mt-2 border-destructive/20 bg-destructive/10">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Account expires soon! Create an account to keep your data.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

interface GuestModeIndicatorProps {
  credits?: number;
  compact?: boolean;
}

export function GuestModeIndicator({ credits, compact = false }: GuestModeIndicatorProps) {
  const daysRemaining = GuestSessionManager.getDaysRemaining();

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Badge variant="outline" className="border-primary/30 text-primary">
          Guest
        </Badge>
        <span className="text-muted-foreground">{credits} credits</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-2 bg-primary/10 border border-primary/20 rounded-md dark:bg-primary/20 dark:border-primary/30">
      <UserPlus className="h-4 w-4 text-primary" />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">Guest Mode</span>
          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-xs">
            {daysRemaining}d left
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">{credits} credits remaining</p>
      </div>
    </div>
  );
}
