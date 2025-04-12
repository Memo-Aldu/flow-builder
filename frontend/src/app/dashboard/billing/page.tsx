import CountUpWrapper from "@/components/CountUpWrapper";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getCredit } from "@/lib/api/balances";
import { auth } from "@clerk/nextjs/server";
import { CoinsIcon } from "lucide-react";
import { Suspense } from "react";

const BillingPage = () => {
  return (
    <div className="mx-auto p-4 space-y-8">
      <h1 className="text-3xl font-bold">Billing</h1>
      <Suspense fallback={ <Skeleton className="h-[166px] w-hull" /> } >
        <BalanceCard />
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

