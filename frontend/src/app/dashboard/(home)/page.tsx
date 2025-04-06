import { Alert, AlertTitle } from "@/components/ui/alert";
import { getAllExecutions, getExecutionStats } from "@/lib/api/executions";
import { ExecutionStats, WorkflowExecutionSortField } from "@/types/executions";
import { auth } from "@clerk/nextjs/server";
import { AlertCircle, CirclePlayIcon, CoinsIcon, WaypointsIcon } from "lucide-react";
import { Suspense } from "react";
import DateSelector from "./_components/DateSelector";
import { Skeleton } from "@/components/ui/skeleton";
import { Period } from "@/types/base";
import { PeriodToDateRange } from "@/lib/helper/dates";
import StatsCard from "@/app/dashboard/(home)/_components/StatsCard";
import ExecutionStatusChart from "@/app/dashboard/(home)/_components/ExecutionStatusChart";
import CreditUsageChart from "@/app/dashboard/billing/_components/CreditUsageChart";

export default async function HomePage({ searchParams }: { searchParams:  { month?: string; year?: string }}) {
  const currentDate = new Date()
  
  const resolvedParams = await Promise.resolve(searchParams); 
  const { month, year } = resolvedParams;
  const period: Period = {
    month: month ? parseInt(month) : currentDate.getMonth() + 1,
    year: year ? parseInt(year) : currentDate.getFullYear(),
  }

  const { userId, getToken } = await auth();
  const token = await getToken();

  if (!userId || !token) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="w-4 h-4" />
        <AlertTitle>Please log in again.</AlertTitle>
      </Alert>
    );
  }

  const dateRange = PeriodToDateRange(period);
  const statsPromise = getExecutionStats(token, dateRange.start, dateRange.end);

  return (
    <div className="flex flex-1 flex-col h-full">
      <div className="flex justify-between">
        <h1 className='text-3xl font-bold'>Home</h1>
        <Suspense fallback={<Skeleton className="w-[180px] h-[40px]" />}>
          <PeriodSelectorWrapper selectedPeriod={period} />
        </Suspense>
      </div>
      <div className="h-full py-6 flex flex-col gap-4">
        <Suspense fallback={<StatsSkeleton />}>
          <StatsCards statsPromise={statsPromise} selectedPeriod={period} />
        </Suspense>
        <Suspense fallback={<Skeleton className="w-full h-[300px]" />}>
          <StatsExecutionStatus statsPromise={statsPromise} selectedPeriod={period} />
        </Suspense>
        <Suspense fallback={<Skeleton className="w-full h-[300px]" />}>
          <CreditUsage statsPromise={statsPromise} selectedPeriod={period} />
        </Suspense>
      </div>
    </div>
  );
}

const PeriodSelectorWrapper = async ({selectedPeriod}: {selectedPeriod: Period}) => {
  const { userId, getToken } = await auth()
  const token = await getToken()
  if (!userId || !token) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="w-4 h-4" />
        <AlertTitle>Please log in again.</AlertTitle>
      </Alert>
    )
  }
  const firstExecution = await getAllExecutions(token, 1, 1, WorkflowExecutionSortField.CREATED_AT, 'asc')

  if (firstExecution.length === 0) {
    return []
  }
  const firstExecutionDate = new Date(firstExecution[0].created_at)
  const now = new Date()
  const periods = []

  for (let year = firstExecutionDate.getFullYear(); year <= now.getFullYear(); year++) {
    for (let month = 1; month <= 12; month++) {
      if (year === firstExecutionDate.getFullYear() && month < firstExecutionDate.getMonth() + 1) {
        continue
      }
      if (year === now.getFullYear() && month > now.getMonth() + 1) {
        continue
      }
      periods.push({ year, month })
    }
  }

  return <DateSelector periods={periods} selectedPeriod={selectedPeriod} />;
}

const StatsCards = async ({statsPromise, selectedPeriod }: {statsPromise: Promise<ExecutionStats>, selectedPeriod: Period}) => {
  const stats = await statsPromise
  return <div className="grid gap-3 lg:gap-8 lg:grid-cols-3 min-h-[120px]">
    <StatsCard title="Total Executions" value={stats.num_executions} icon={CirclePlayIcon} />
    <StatsCard title="Total Credits Used" value={stats.total_credits} icon={WaypointsIcon} />
    <StatsCard title="Phase Executions" value={stats.num_phases} icon={CoinsIcon} />
  </div>
}

const StatsSkeleton = () => {
  return <div className="grid gap-3 lg:gap-8 lg:grid-cols-3">
    {
      [1,2,3].map((i) => (<Skeleton key={i} className="w-full min-h-[120px]"/>))
    }
  </div>
}


const StatsExecutionStatus = async ({statsPromise, selectedPeriod }: {statsPromise: Promise<ExecutionStats>, selectedPeriod: Period}) => {
  const stats = await statsPromise
  return (
    <ExecutionStatusChart data={stats.execution_dates_status} />
  )
}


const CreditUsage = async ({statsPromise, selectedPeriod }: {statsPromise: Promise<ExecutionStats>, selectedPeriod: Period}) => {
  const stats = await statsPromise
  return (
    <CreditUsageChart data={stats.credits_dates_status} title={"Daily credits spend"} 
      description={"Daily credits consumed in the selected period"}
    />
  )
}

