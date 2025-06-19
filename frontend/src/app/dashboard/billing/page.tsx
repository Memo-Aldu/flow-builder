"use client";

import CreditsPurchase from "@/app/dashboard/billing/_components/CreditsPurchase";
import CreditUsageChart from "@/app/dashboard/billing/_components/CreditUsageChart";
import CountUpWrapper from "@/components/CountUpWrapper";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useUnifiedAuth } from "@/contexts/AuthContext";
import { useUserBalance } from "@/hooks/useUserBalance";
import { UnifiedExecutionsAPI, UnifiedPurchasesAPI } from "@/lib/api/unified-functions-client";
import { PeriodToDateRange } from "@/lib/helper/dates";
import { Period } from "@/types/base";
import { AlertCircle, ArrowLeftRightIcon, CoinsIcon, Loader2Icon } from "lucide-react";
import Link from "next/link";
import React, { Suspense } from "react";

const BillingPage = () => {
  const { user, isAuthenticated } = useUnifiedAuth();

  // Guest users cannot access billing
  if (isAuthenticated && user?.isGuest) {
    return (
      <div className="mx-auto p-4 space-y-8">
        <h1 className="text-3xl font-bold">Billing</h1>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Guest Access Limitation</AlertTitle>
          <AlertDescription>
            Billing features are not available for guest users.
            <Link href="/sign-up" className="underline ml-1">
              Create an account
            </Link> to access billing and purchase credits.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="mx-auto p-4 space-y-8">
      <h1 className="text-3xl font-bold">Billing</h1>
      <BalanceCard />
      <CreditsPurchase />
      <Suspense fallback={<Skeleton className="h-[166px] w-hull" />}>
        <CreditsUsageCard />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-[166px] w-hull" />}>
        <PurchaseHistoryCard />
      </Suspense>
    </div>
  )
}

export default BillingPage

const BalanceCard = () => {
  const { balance, isLoading } = useUserBalance();

  return (
    <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background
    border-primary/20 shadow-lg flex justify-between flex-col overflow-hidden">
      <CardContent className="p-6 relative items-center">
        <div className="flex justify-between items-center">
          <div className="">
            <h3 className="text-lg font-semibold text-foreground mb-1">
              Available Credits
            </h3>
            <p className="text-4xl font-bold text-primary">
              {isLoading ? (
                <Loader2Icon className="h-8 w-8 animate-spin" />
              ) : (
                <><CountUpWrapper value={balance} /> credits</>
              )}
            </p>
            <CoinsIcon className="text-primary opacity-20 absolute bottom-0 right-0" size={140} />
          </div>
        </div>
      </CardContent>
      <CardFooter className="text-muted-foreground text-sm">
        When you run out of credits, your workflows will get disabled until you add more credits.
      </CardFooter>
    </Card>
  )
}


const CreditsUsageCard = () => {
  const { getToken, user } = useUnifiedAuth();

  const period: Period = {
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  }

  const [stats, setStats] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchStats = async () => {
      if (user?.isGuest) return; // Don't fetch for guest users

      try {
        const token = await getToken();
        if (!token) {
          console.error('No token available');
          return;
        }
        const dateRange = PeriodToDateRange(period);
        const data = await UnifiedExecutionsAPI.client.getStats(
          dateRange.start.toISOString(),
          dateRange.end.toISOString(),
          token
        );
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [getToken, user?.isGuest]);

  if (user?.isGuest) return null;
  if (isLoading) return <div>Loading...</div>;
  if (!stats) return <div>Failed to load stats</div>;

  return <CreditUsageChart data={stats.credits_dates_status} title={"Credits spend"}
    description={"Daily credits consumed this month"}
  />
}


const PurchaseHistoryCard = () => {
  const { getToken, user } = useUnifiedAuth();
  const [purchases, setPurchases] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchPurchases = async () => {
      if (user?.isGuest) return; // Don't fetch for guest users

      try {
        const token = await getToken();
        if (!token) {
          console.error('No token available');
          return;
        }
        const data = await UnifiedPurchasesAPI.client.list(1, 50, token);
        setPurchases(data);
      } catch (error) {
        console.error('Failed to fetch purchases:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPurchases();
  }, [getToken, user?.isGuest]);

  if (user?.isGuest) return null;
  if (isLoading) return <div>Loading...</div>;

  return (
    <Card className="">
      <CardHeader>
        <CardTitle className="text-2xl font-bold flex items-center gap-2">
          <ArrowLeftRightIcon className="text-primary h-6 w-6" />
          Purchase History
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          View your purchase history.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {purchases.length === 0 && (
          <p className="text-muted-foreground text-sm">
            No purchases found. You can buy credits in the billing page.
          </p>
        )}
        {
          purchases.map((purchase) => (
            <div key={purchase.id} className="flex justify-between items-center py-3 border-b last:border-b-0">
              <div className="">
                <p className="font-medium">{formatDate(purchase.date)}</p>
                <p className="text-xs text-muted-foreground">{purchase.description}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">
                  {formatPrice(purchase.amount, purchase.currency)}
                </p>
              </div>
            </div>
          ))
        }
      </CardContent>
    </Card>
  )
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

const formatPrice = (amount: number, currency: string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount / 100);
}

