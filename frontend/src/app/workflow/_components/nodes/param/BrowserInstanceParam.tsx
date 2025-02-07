"use client";

import { ParamProps } from '@/types/nodes';
import React from 'react'

const BrowserInstanceParam = ({ param }: ParamProps) => {
  return (
    <p className="text-xs">{param.name}</p>
  )
}

export default BrowserInstanceParam