import CreditsPurchase from "@/app/dashboard/billing/_components/CreditsPurchase";
import CreditUsageChart from "@/app/dashboard/billing/_components/CreditUsageChart";
import CountUpWrapper from "@/components/CountUpWrapper";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getCredit } from "@/lib/api/balances";
import { getExecutionStats } from "@/lib/api/executions";
import { getPurchases } from "@/lib/api/purchases";
import { PeriodToDateRange } from "@/lib/helper/dates";
import { Period } from "@/types/base";
import { auth } from "@clerk/nextjs/server";
import { ArrowLeftRightIcon, CoinsIcon } from "lucide-react";
import { Suspense } from "react";

const BillingPage = () => {
  return (
    <div className="mx-auto p-4 space-y-8">
      <h1 className="text-3xl font-bold">Billing</h1>
      <Suspense fallback={<Skeleton className="h-[166px] w-hull" />} >
        <BalanceCard />
      </Suspense>
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

const BalanceCard = async () => {
  const { getToken } = await auth()

  const getUserBalance = async () => {
    const token = await getToken()
    if (!token) {
      throw new Error('No valid token found.')
    }
    return getCredit(token)
  }

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
              <CountUpWrapper value={await getUserBalance()} /> credits
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


const CreditsUsageCard = async () => {
  const { getToken } = await auth()

  const period: Period = {
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  }

  const token = await getToken()
  if (!token) {
    throw new Error('No valid token found.')
  }

  const dateRange = PeriodToDateRange(period);
  const stats = await getExecutionStats(token, dateRange.start, dateRange.end);


  return <CreditUsageChart data={stats.credits_dates_status} title={"Credits spend"}
    description={"Daily credits consumed this month"}
  />
}


const PurchaseHistoryCard = async () => {
  const { getToken } = await auth()

  const token = await getToken()
  if (!token) {
    throw new Error('No valid token found.')
  }

  const purchases = await getPurchases(token, 1, 50)

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

