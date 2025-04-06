"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Layers2Icon } from 'lucide-react'
import React from 'react'
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts'


const chartConfig = {
    success: {
        label: 'Success',
        color: "hsl(var(--chart-2))"
    },
    failure: {
        label: 'Failure',
        color: "hsl(var(--chart-1))"
    },
}

const ExecutionStatusChart = ({ data }: { data: Array<{ date: string; success: number; failure: number }>}) => {
  return (
    <Card>
        <CardHeader>
            <CardTitle className='text-2xl font-bold flex items-center gap-2'>
                <Layers2Icon className='h-6 w-6 text-primary'/>Workflow Execution Status
            </CardTitle>
            <CardDescription>
                Number of successful and failed workflow executions
            </CardDescription>
        </CardHeader>
        <CardContent>
            <ChartContainer config={chartConfig} className='max-h-[200px] w-full'>
                <AreaChart data={data} height={200} accessibilityLayer margin={{ top: 20}} >
                    <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                    <XAxis 
                        dataKey="date" 
                        tickLine={false} 
                        axisLine={false}
                        tickMargin={8}
                        minTickGap={32}
                        tickFormatter={(date) => {
                            const dateObj = new Date(date)
                            return dateObj.toLocaleDateString('en-US', {
                                month: 'short',
                                day: "numeric",
                            })
                        }}
                        />
                    <ChartLegend content={<ChartLegendContent/>} />
                    <ChartTooltip content={<ChartTooltipContent className='w-[250px]'/>} />
                    <Area 
                        min={0} 
                        type={"bump"} 
                        fill="var(--color-success)" 
                        fillOpacity={0.6} 
                        dataKey={'success'}
                        stroke='var(--color-success)'
                        stackId={"a"}
                        name={chartConfig.success.label} />
                    <Area 
                        min={0}
                        dataKey={'failure'} 
                        type={"bump"}
                        fill="var(--color-failure)"
                        fillOpacity={0.6}
                        stroke='var(--color-failure)'
                        stackId={"a"}
                        name={chartConfig.failure.label} />
                </AreaChart>
            </ChartContainer>
        </CardContent>
    </Card>
  )
}

export default ExecutionStatusChart