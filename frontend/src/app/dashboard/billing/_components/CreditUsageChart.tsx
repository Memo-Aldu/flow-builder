"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { ChartColumnStackedIcon } from 'lucide-react'
import React from 'react'
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts'


const chartConfig = {
    success: {
        label: 'Successful Phase Credits',
        color: "hsl(var(--chart-2))"
    },
    failure: {
        label: 'Failed Phase Credits',
        color: "hsl(var(--chart-1))"
    },
}

const CreditUsageChart = ({ data, title, description }: { data: Array<{ date: string; success: number; failure: number }>, title: string, description: string}) => {
  return (
    <Card>
        <CardHeader>
            <CardTitle className='text-2xl font-bold flex items-center gap-2'>
                <ChartColumnStackedIcon className='h-6 w-6 text-primary'/>
                {title}
            </CardTitle>
            <CardDescription>
                {description}
            </CardDescription>
        </CardHeader>
        <CardContent>
            <ChartContainer config={chartConfig} className='max-h-[200px] w-full'>
                <BarChart data={data} height={200} accessibilityLayer margin={{ top: 20}} >
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
                    <Bar 
                        fill="var(--color-success)" 
                        radius={[4, 4, 0, 0]}
                        fillOpacity={0.8} 
                        dataKey={'success'}
                        stroke='var(--color-success)'
                        stackId={"a"}
                        name={chartConfig.success.label} />
                    <Bar 
                        dataKey={'failure'} 
                        radius={[4, 4, 0, 0]}
                        fill="var(--color-failure)"
                        fillOpacity={0.6}
                        stroke='var(--color-failure)'
                        stackId={"a"}
                        name={chartConfig.failure.label} />
                </BarChart>
            </ChartContainer>
        </CardContent>
    </Card>
  )
}

export default CreditUsageChart