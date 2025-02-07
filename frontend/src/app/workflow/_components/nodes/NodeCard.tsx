"use client";

import { cn } from '@/lib/utils';
import { useReactFlow } from '@xyflow/react';
import React from 'react'

type NodeCardProps = {
    nodeId: string
    isSelected?: boolean
    children: React.ReactNode
}


const NodeCard = ({ nodeId, isSelected, children }: NodeCardProps) => {
  const { getNode, setCenter } = useReactFlow()

  return (
    <div 
    onDoubleClick={() => {
        const node = getNode(nodeId)
        if (!node) return
        const { position, measured } = node
        if (!position || !measured) return
        const { width, height } = measured
        const x = position.x + width! / 2
        const y = position.y + height! / 2
        if (x === undefined || y === undefined) return
        setCenter(x, y, {
            zoom: 1,
            duration: 500,
        })
    }}
    className={cn(
        "rounded-md cursor-pointer bg-background border-2 border-separate w-[460px] text-xs gap-1 flex flex-col",
         isSelected ? "border-primary" : "border-secondary")}>

        {children}
    </div>
  )
}

export default NodeCard