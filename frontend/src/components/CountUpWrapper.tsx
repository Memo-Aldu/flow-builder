"use client"
import React, { useEffect } from 'react'
import CountUp from 'react-countup'


const CountUpWrapper = ({ value }: { value: number }) => {
  const [mounted, setMounted] = React.useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return value
  return (
    <CountUp duration={0.5} preserveValue end={value} decimals={0}/>
  )
}

export default CountUpWrapper