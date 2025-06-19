"use client";

import {
    AlertTriangle,
    ArrowRight,
    CheckCircle,
    Clock,
    UserPlus,
    Zap
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUnifiedAuth } from "@/contexts/AuthContext";
import { GuestSessionManager } from "@/lib/api/guest";
import { useRouter } from "next/navigation";
import { useUserBalance } from "@/hooks/useUserBalance";

const GuestInfoPage = () => {
  const { user, isAuthenticated } = useUnifiedAuth();
  const { balance } = useUserBalance();
  const router = useRouter();
  const [daysRemaining, setDaysRemaining] = useState(0);

  useEffect(() => {
    const days = GuestSessionManager.getDaysRemaining();
    setDaysRemaining(days);
  }, []);

  // Redirect if not in guest mode
  useEffect(() => {
    if (isAuthenticated && !user?.isGuest) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, user?.isGuest, router]);

  if (!isAuthenticated || !user?.isGuest) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Guest Information</h1>
        <p className="text-muted-foreground mt-2">
          Your guest account details and trial information
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Guest Status Card */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-foreground text-lg">
              <UserPlus className="h-5 w-5" />
              Guest Mode
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                Trial
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Credits</span>
                </div>
                <span className="font-semibold text-foreground">{balance ?? 0}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Days left</span>
                </div>
                <span className="font-semibold text-foreground">{daysRemaining}</span>
              </div>
            </div>

            {daysRemaining <= 1 && (
              <Alert variant="destructive" className="border-destructive/20 bg-destructive/10">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Account expires soon! Create an account to keep your data.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Link href="/sign-up">
                <Button
                  className="my-2 w-full bg-primary hover:bg-primary/90"
                  size="sm"
                >
                  Create Account
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>

              <Link href="/sign-in">
                <Button
                  variant="outline"
                  className="w-full border-primary/30 text-primary hover:bg-primary/10"
                  size="sm"
                >
                  Sign In
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Features Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">What You Can Do</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Create workflows</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Execute tasks</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Store credentials</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Full feature access</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FAQ Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-sm mb-1">What happens after 3 days?</h4>
            <p className="text-sm text-muted-foreground">
              Your guest account and all data will be automatically deleted. 
              Create a full account to keep your workflows and get more credits.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-1">Can I convert my guest account?</h4>
            <p className="text-sm text-muted-foreground">
              Yes! You can sign up anytime during your trial to convert your guest account 
              and keep all your data.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-1">Are there any limitations?</h4>
            <p className="text-sm text-muted-foreground">
              Guest accounts have the same features as full accounts but with limited credits 
              and a 3-day expiration. You cannot purchase additional credits as a guest.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default GuestInfoPage;
